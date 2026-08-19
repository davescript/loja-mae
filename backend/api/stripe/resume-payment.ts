import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { requireAuth } from '../../utils/auth';
import { executeOne, executeRun } from '../../utils/db';
import { isStripeError, logStripeError, stripeErrorResponse } from '../../utils/stripeErrors';
import Stripe from 'stripe';

export async function handleResumePayment(request: Request, env: Env): Promise<Response> {
  try {
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return errorResponse('Stripe not configured', 500);
    }

    let customerId: number | null = null;
    try {
      const user = await requireAuth(request, env, 'customer');
      customerId = user.id;
    } catch {
      return errorResponse('Autenticação necessária', 401);
    }

    const body = await request.json() as { order_number: string };
    const { order_number } = body;

    if (!order_number) {
      return errorResponse('Número do pedido obrigatório', 400);
    }

    const db = getDb(env);

    const order = await executeOne<{
      id: number;
      order_number: string;
      customer_id: number | null;
      email: string;
      payment_status: string;
      status: string;
      total_cents: number;
      stripe_payment_intent_id: string | null;
    }>(
      db,
      'SELECT id, order_number, customer_id, email, payment_status, status, total_cents, stripe_payment_intent_id FROM orders WHERE order_number = ?',
      [order_number]
    );

    if (!order) {
      return errorResponse('Pedido não encontrado', 404);
    }

    if (order.customer_id !== customerId) {
      return errorResponse('Pedido não pertence a este cliente', 403);
    }

    if (order.payment_status === 'paid') {
      return errorResponse('Este pedido já foi pago', 400);
    }

    if (order.status === 'cancelled') {
      return errorResponse('Este pedido foi cancelado', 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

    // Tentar reutilizar o PaymentIntent existente
    if (order.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
        const reusableStatuses = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
        if (reusableStatuses.includes(existing.status) && existing.client_secret) {
          return successResponse({
            client_secret: existing.client_secret,
            order_id: order.id,
            order_number: order.order_number,
            total_cents: order.total_cents,
            payment_intent_id: existing.id,
          });
        }
      } catch {
        // PaymentIntent inválido — criar novo abaixo
      }
    }

    // Criar novo PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total_cents,
      currency: 'eur',
      receipt_email: order.email !== 'guest@example.com' ? order.email : undefined,
      payment_method_types: ['mb_way', 'card', 'klarna'],
      payment_method_options: {
        klarna: { preferred_locale: 'pt-PT' },
      },
      metadata: {
        order_id: order.id.toString(),
        order_number: order.order_number,
        customer_id: customerId.toString(),
      },
      description: `Pedido ${order.order_number} - Loja Mãe (retoma)`,
    });

    await executeRun(
      db,
      'UPDATE orders SET stripe_payment_intent_id = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [paymentIntent.id, order.id]
    );

    return successResponse({
      client_secret: paymentIntent.client_secret,
      order_id: order.id,
      order_number: order.order_number,
      total_cents: order.total_cents,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    if (isStripeError(error)) {
      logStripeError('Resume payment error', error);
      return stripeErrorResponse(error);
    }
    console.error('Resume payment error:', error);
    return errorResponse('Erro ao retomar pagamento', 500);
  }
}
