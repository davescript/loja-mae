import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import { generateOrderNumber } from '../../utils/db';
import Stripe from 'stripe';
import { executeOne, executeRun, executeQuery } from '../../utils/db';

interface CreateIntentRequest {
  items: Array<{
    product_id: number;
    variant_id?: number | null;
    quantity: number;
  }>;
  shipping_address?: any;
}

export async function handleCreateIntent(request: Request, env: Env): Promise<Response> {
  try {
    const db = getDb(env);
    const stripeSecretKey = env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return errorResponse('Stripe not configured', 500);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

    // Tentar autenticar (opcional - guest checkout permitido)
    let customerId: number | null = null;
    try {
      const user = await requireAuth(request, env, 'both');
      if (user.type === 'customer') {
        customerId = user.id;
      }
    } catch {
      // Guest checkout permitido
    }

    const body = await request.json() as CreateIntentRequest;
    const { items } = body;

    if (!items || items.length === 0) {
      return errorResponse('Cart is empty', 400);
    }

    // Validar e calcular total no servidor (anti-fraude)
    let totalCents = 0;
    const orderItems: Array<{
      product_id: number;
      variant_id: number | null;
      quantity: number;
      price_cents: number;
      product_title: string;
    }> = [];

    for (const item of items) {
      // Buscar produto do banco para validar preço real
      const product = await executeOne<{
        id: number;
        title: string;
        price_cents: number;
        stock_quantity: number;
        status: string;
      }>(
        db,
        'SELECT id, title, price_cents, stock_quantity, status FROM products WHERE id = ?',
        [item.product_id]
      );

      if (!product) {
        return errorResponse(`Product ${item.product_id} not found`, 404);
      }

      if (product.status !== 'active') {
        return errorResponse(`Product ${product.title} is not available`, 400);
      }

      if (product.stock_quantity < item.quantity) {
        return errorResponse(`Insufficient stock for ${product.title}`, 400);
      }

      let priceCents = product.price_cents;
      let productTitle = product.title;

      // Se tem variante, buscar preço da variante
      if (item.variant_id) {
        const variant = await executeOne<{
          id: number;
          title: string;
          price_cents: number;
          stock_quantity: number;
        }>(
          db,
          'SELECT id, title, price_cents, stock_quantity FROM product_variants WHERE id = ? AND product_id = ?',
          [item.variant_id, item.product_id]
        );

        if (!variant) {
          return errorResponse(`Variant ${item.variant_id} not found`, 404);
        }

        if (variant.stock_quantity < item.quantity) {
          return errorResponse(`Insufficient stock for variant`, 400);
        }

        priceCents = variant.price_cents;
        productTitle = `${product.title} - ${variant.title}`;
      }

      const itemTotal = priceCents * item.quantity;
      totalCents += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        price_cents: priceCents,
        product_title: productTitle,
      });
    }

    if (totalCents <= 0) {
      return errorResponse('Invalid total amount', 400);
    }

    // Criar pedido no banco (status: pending)
    const orderNumber = generateOrderNumber();
    
    // Calcular subtotais (simplificado - pode ser melhorado)
    const subtotalCents = totalCents;
    const taxCents = 0;
    const shippingCents = 0;
    const discountCents = 0;
    
    // Obter email do usuário ou usar guest
    let email = 'guest@example.com';
    try {
      const user = await requireAuth(request, env, 'both');
      if (user.type === 'customer') {
        // Buscar email do cliente
        const customer = await executeOne<{ email: string }>(
          db,
          'SELECT email FROM customers WHERE id = ?',
          [customerId]
        );
        if (customer) {
          email = customer.email;
        }
      }
    } catch {
      // Guest checkout - tentar pegar email do body se fornecido
      if (body.shipping_address?.email) {
        email = body.shipping_address.email;
      }
    }
    
    // Criar endereço padrão se não fornecido (shipping_address_json é NOT NULL)
    const defaultAddress = {
      street: '',
      city: '',
      postal_code: '',
      country: 'PT',
      address_line1: '',
      address_line2: '',
      state: '',
    };
    
    const shippingAddressJson = body.shipping_address 
      ? JSON.stringify(body.shipping_address)
      : JSON.stringify(defaultAddress);
    
    const billingAddressJson = body.shipping_address 
      ? JSON.stringify(body.shipping_address)
      : JSON.stringify(defaultAddress);
    
    const orderResult = await executeRun(
      db,
      `INSERT INTO orders (
        order_number, customer_id, email, status, payment_status, fulfillment_status,
        subtotal_cents, tax_cents, shipping_cents, discount_cents, total_cents,
        shipping_address_json, billing_address_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        orderNumber,
        customerId,
        email,
        'pending',
        'pending',
        'unfulfilled',
        subtotalCents,
        taxCents,
        shippingCents,
        discountCents,
        totalCents,
        shippingAddressJson,
        billingAddressJson,
      ]
    );

    if (!orderResult.success) {
      return errorResponse('Failed to create order', 500);
    }

    const orderId = orderResult.meta.last_row_id;

    // Criar itens do pedido
    for (const orderItem of orderItems) {
      await executeRun(
        db,
        `INSERT INTO order_items (
          order_id, product_id, variant_id, title, sku, quantity, price_cents, total_cents, image_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          orderId,
          orderItem.product_id,
          orderItem.variant_id,
          orderItem.product_title,
          null, // sku - pode ser melhorado
          orderItem.quantity,
          orderItem.price_cents,
          orderItem.price_cents * orderItem.quantity,
          null, // image_url - pode ser melhorado
        ]
      );
    }

    // Validar valor mínimo para EUR (Stripe requer mínimo de 0.50 EUR = 50 centavos)
    if (totalCents < 50) {
      return errorResponse('Valor mínimo do pedido é €0,50', 400);
    }

    // Criar Payment Intent no Stripe
    // Nota: Para EUR, o valor mínimo é 0.50 EUR (50 centavos)
    // Para métodos como Klarna, Bancontact, etc., pode haver requisitos adicionais
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      metadata: {
        order_id: orderId.toString(),
        order_number: orderNumber,
        customer_id: customerId?.toString() || 'guest',
      },
      // Usar apenas card para evitar problemas com métodos que requerem configuração adicional
      payment_method_types: ['card'],
      // Manter automatic_payment_methods desabilitado para evitar métodos não configurados
      // automatic_payment_methods: {
      //   enabled: true,
      // },
      description: `Pedido ${orderNumber} - Loja Mãe`,
      capture_method: 'automatic',
      // Adicionar informações de confirmação
      confirmation_method: 'automatic',
      // IMPORTANTE: Não definir shipping aqui - deixar o PaymentElement coletar
      // O PaymentElement vai coletar o endereço automaticamente quando configurado
    });

    if (!paymentIntent.client_secret) {
      console.error('Payment Intent criado sem client_secret:', paymentIntent);
      return errorResponse('Failed to create payment intent - no client secret', 500);
    }

    // Atualizar pedido com payment intent ID
    await executeRun(
      db,
      'UPDATE orders SET stripe_payment_intent_id = ? WHERE id = ?',
      [paymentIntent.id, orderId]
    );

    return successResponse({
      client_secret: paymentIntent.client_secret,
      order_id: orderId,
      order_number: orderNumber,
      total_cents: totalCents,
    });
  } catch (error) {
    console.error('Create intent error:', error);
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

