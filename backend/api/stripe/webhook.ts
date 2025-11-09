import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { getOrderByNumber, updateOrderPayment } from '../../modules/orders';
import Stripe from 'stripe';

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing');
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse('Missing stripe-signature header', 400);
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return errorResponse(`Webhook signature verification failed: ${err.message}`, 400);
    }

    const db = getDb(env);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;
        const orderNumber = paymentIntent.metadata?.order_number;

        if (orderId) {
          await updateOrderPayment(
            db,
            parseInt(orderId),
            paymentIntent.id,
            paymentIntent.latest_charge as string
          );
        } else if (orderNumber) {
          const order = await getOrderByNumber(db, orderNumber);
          if (order) {
            await updateOrderPayment(
              db,
              order.id,
              paymentIntent.id,
              paymentIntent.latest_charge as string
            );
          }
        }

        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          const { executeRun } = await import('../../utils/db');
          await executeRun(
            db,
            'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
            ['failed', 'cancelled', parseInt(orderId)]
          );
        }

        console.log('PaymentIntent failed:', paymentIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const { executeOne, executeRun } = await import('../../utils/db');
          const order = await executeOne<{ id: number }>(
            db,
            'SELECT id FROM orders WHERE stripe_payment_intent_id = ?',
            [paymentIntentId]
          );

          if (order) {
            await executeRun(
              db,
              'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
              ['refunded', 'refunded', order.id]
            );
          }
        }

        console.log('Charge refunded:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return successResponse({ received: true });
  } catch (error) {
    const { message, status, details } = handleError(error);
    console.error('Webhook error:', error);
    return errorResponse(message, status, details);
  }
}

