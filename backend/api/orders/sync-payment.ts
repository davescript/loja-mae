import type { Env } from '../../types';
import { getDb, executeOne } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { updateOrderPayment, getOrder } from '../../modules/orders';
import Stripe from 'stripe';

/**
 * Sincroniza status de pagamento verificando diretamente no Stripe
 * Útil quando o webhook falha ou não é recebido
 */
export async function handleSyncPaymentStatus(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const db = getDb(env);
    const stripeSecretKey = env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return errorResponse('Stripe not configured', 500);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
    const url = new URL(request.url);
    const orderId = url.searchParams.get('order_id');
    const orderNumber = url.searchParams.get('order_number');
    const paymentIntentId = url.searchParams.get('payment_intent_id');

    if (!orderId && !orderNumber && !paymentIntentId) {
      return errorResponse('order_id, order_number or payment_intent_id required', 400);
    }

    // Buscar pedido
    let order;
    if (orderId) {
      order = await getOrder(db, parseInt(orderId));
    } else if (orderNumber) {
      const { getOrderByNumber } = await import('../../modules/orders');
      order = await getOrderByNumber(db, orderNumber);
    } else if (paymentIntentId) {
      order = await executeOne<{
        id: number;
        order_number: string;
        stripe_payment_intent_id: string | null;
        payment_status: string;
        status: string;
      }>(
        db,
        'SELECT id, order_number, stripe_payment_intent_id, payment_status, status FROM orders WHERE stripe_payment_intent_id = ?',
        [paymentIntentId]
      );
    }

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Se já está pago, retornar sucesso
    if (order.payment_status === 'paid' && order.status === 'paid') {
      return successResponse({
        message: 'Order already paid',
        order_id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        status: order.status,
      });
    }

    // Buscar PaymentIntent no Stripe
    const piId = paymentIntentId || order.stripe_payment_intent_id;
    if (!piId) {
      return errorResponse('Payment Intent ID not found', 400);
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(piId);

      // Se o pagamento foi bem-sucedido, atualizar pedido
      if (paymentIntent.status === 'succeeded') {
        await updateOrderPayment(
          db,
          order.id,
          paymentIntent.id,
          paymentIntent.latest_charge as string
        );

        const updatedOrder = await getOrder(db, order.id);
        return successResponse({
          message: 'Payment status synced successfully',
          order_id: order.id,
          order_number: order.order_number,
          payment_status: updatedOrder?.payment_status,
          status: updatedOrder?.status,
          stripe_status: paymentIntent.status,
        });
      } else {
        return successResponse({
          message: 'Payment not yet succeeded',
          order_id: order.id,
          order_number: order.order_number,
          payment_status: order.payment_status,
          status: order.status,
          stripe_status: paymentIntent.status,
        });
      }
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return errorResponse(`Stripe error: ${stripeError.message}`, 500);
    }
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

