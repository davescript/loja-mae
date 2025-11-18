import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import { generateOrderNumber } from '../../utils/db';
import Stripe from 'stripe';
import { executeOne, executeRun } from '../../utils/db';

interface CreateIntentRequest {
  items: Array<{
    product_id: number;
    variant_id?: number | null;
    quantity: number;
  }>;
  address_id?: number;
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
    
    // Resolver endereço selecionado
    let shippingAddressPayload: any = null;
    let shippingAddressId: number | null = null;

    if (body.address_id) {
      if (!customerId) {
        return errorResponse('Autenticação necessária para usar um endereço salvo', 401);
      }

      const savedAddress = await executeOne<{
        id: number;
        first_name: string;
        last_name: string;
        company: string | null;
        address_line1: string;
        address_line2: string | null;
        city: string;
        state: string;
        postal_code: string;
        country: string;
        phone: string | null;
      }>(
        db,
        'SELECT * FROM addresses WHERE id = ? AND customer_id = ?',
        [body.address_id, customerId]
      );

      if (!savedAddress) {
        return errorResponse('Endereço selecionado não encontrado', 404);
      }

      shippingAddressId = savedAddress.id;
      shippingAddressPayload = {
        first_name: savedAddress.first_name,
        last_name: savedAddress.last_name,
        company: savedAddress.company,
        address_line1: savedAddress.address_line1,
        address_line2: savedAddress.address_line2,
        city: savedAddress.city,
        state: savedAddress.state,
        postal_code: savedAddress.postal_code,
        country: savedAddress.country || 'PT',
        phone: savedAddress.phone,
      };
    } else if (body.shipping_address) {
      shippingAddressPayload = {
        first_name: body.shipping_address.first_name || '',
        last_name: body.shipping_address.last_name || '',
        company: body.shipping_address.company || null,
        address_line1: body.shipping_address.address_line1 || '',
        address_line2: body.shipping_address.address_line2 || null,
        city: body.shipping_address.city || '',
        state: body.shipping_address.state || '',
        postal_code: body.shipping_address.postal_code || '',
        country: body.shipping_address.country || 'PT',
        phone: body.shipping_address.phone || null,
      };
    }

    if (!shippingAddressPayload || !shippingAddressPayload.address_line1) {
      return errorResponse('Endereço de entrega obrigatório', 400);
    }
    
    const orderResult = await executeRun(
      db,
      `INSERT INTO orders (
        order_number, customer_id, email, status, payment_status, fulfillment_status,
        subtotal_cents, tax_cents, shipping_cents, discount_cents, total_cents,
        currency, shipping_address_json, billing_address_json, shipping_address_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
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
        'EUR',
        JSON.stringify(shippingAddressPayload),
        JSON.stringify(shippingAddressPayload),
        shippingAddressId,
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
    // Métodos permitidos: Cartão, MB Way (via link), Klarna
    // Apple Pay e Google Pay aparecem automaticamente quando card está habilitado e o dispositivo suporta
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      metadata: {
        order_id: orderId.toString(),
        order_number: orderNumber,
        customer_id: customerId?.toString() || 'guest',
      },
      // Métodos de pagamento específicos: Cartão, MB Way (link), Klarna
      payment_method_types: ['card', 'link', 'klarna'],
      description: `Pedido ${orderNumber} - Loja Mãe`,
      // Adicionar shipping address para métodos que requerem
      shipping: shippingAddressPayload ? {
        name: `${shippingAddressPayload.first_name} ${shippingAddressPayload.last_name}`,
        address: {
          line1: shippingAddressPayload.address_line1,
          line2: shippingAddressPayload.address_line2 || undefined,
          city: shippingAddressPayload.city,
          state: shippingAddressPayload.state || undefined,
          postal_code: shippingAddressPayload.postal_code,
          country: shippingAddressPayload.country || 'PT',
        },
        phone: shippingAddressPayload.phone || undefined,
      } : undefined,
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
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create intent error:', error);
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

