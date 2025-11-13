import type { Env } from '../../types';
import { getDb, executeQuery, executeRun, executeOne } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { getOrderByNumber, updateOrderPayment, getOrder } from '../../modules/orders';
import { sendEmail, generateOrderConfirmationEmail } from '../../utils/email';
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

        let finalOrderId: number | null = null;

        if (orderId) {
          finalOrderId = parseInt(orderId);
        } else if (orderNumber) {
          const order = await getOrderByNumber(db, orderNumber);
          if (order) {
            finalOrderId = order.id;
          }
        } else {
          // Try to find order by stripe_payment_intent_id as fallback
          const order = await executeOne<{ id: number }>(
            db,
            'SELECT id FROM orders WHERE stripe_payment_intent_id = ?',
            [paymentIntent.id]
          );
          if (order) {
            finalOrderId = order.id;
          }
        }

        if (finalOrderId) {
          // Atualizar status do pedido
          await updateOrderPayment(
            db,
            finalOrderId,
            paymentIntent.id,
            paymentIntent.latest_charge as string
          );

          // Adicionar tracking history
          try {
            await executeRun(
              db,
              `INSERT INTO order_status_history (
                order_id, status, payment_status, fulfillment_status, notes, created_at
              ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
              [
                finalOrderId,
                'paid',
                'paid',
                'unfulfilled',
                `Pagamento confirmado via Stripe - Payment Intent: ${paymentIntent.id}`,
              ]
            );
          } catch (err) {
            console.error('Error adding tracking history:', err);
            // Não falhar se a tabela não existir ainda
          }

          // Diminuir estoque dos produtos
          const orderItems = await executeQuery<{
            product_id: number;
            variant_id: number | null;
            quantity: number;
          }>(
            db,
            'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
            [finalOrderId]
          );

          for (const item of orderItems) {
            if (item.variant_id) {
              // Atualizar estoque da variante
              await executeRun(
                db,
                'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.variant_id]
              );
            } else {
              // Atualizar estoque do produto
              await executeRun(
                db,
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
              );
            }
          }

          // Enviar email de confirmação
          try {
            const order = await getOrder(db, finalOrderId, true);
            if (order && order.email) {
              const orderItems = await executeQuery<{
                title: string;
                quantity: number;
                price_cents: number;
              }>(
                db,
                `SELECT 
                  p.title,
                  oi.quantity,
                  oi.price_cents
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?`,
                [finalOrderId]
              );

              // Parse shipping address from JSON
              let shippingAddress = undefined;
              if (order.shipping_address_json) {
                try {
                  const addr = typeof order.shipping_address_json === 'string' 
                    ? JSON.parse(order.shipping_address_json)
                    : order.shipping_address_json;
                  shippingAddress = {
                    street: addr.street || '',
                    city: addr.city || '',
                    postal_code: addr.postal_code || '',
                    country: addr.country || '',
                  };
                } catch (e) {
                  console.error('Error parsing shipping address:', e);
                }
              }

              const emailHtml = generateOrderConfirmationEmail({
                order_number: order.order_number,
                total_cents: order.total_cents,
                items: orderItems.map(item => ({
                  title: item.title,
                  quantity: item.quantity,
                  price_cents: item.price_cents,
                })),
                customer_name: order.email.split('@')[0],
                shipping_address: shippingAddress,
              });

              await sendEmail(env, {
                to: order.email,
                subject: `Confirmação de Pedido #${order.order_number} - Loja Mãe`,
                html: emailHtml,
              });
            }
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Não falhar o webhook se o email falhar
          }
        }

        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
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

