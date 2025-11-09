import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { createOrder, updateOrderPayment } from '../../modules/orders';
import { validateCoupon, applyCoupon } from '../../modules/coupons';
import { createOrderSchema } from '../../validators/orders';
import Stripe from 'stripe';

export async function handleCheckout(request: Request, env: Env): Promise<Response> {
  try {
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    const db = getDb(env);

    // Try to get customer from auth
    let customerId: number | null = null;
    try {
      const { requireAuth } = await import('../../utils/auth');
      const user = await requireAuth(request, env, 'customer');
      customerId = user.id;
    } catch {
      // Guest checkout
    }

    // Validate coupon if provided
    let couponId: number | null = null;
    let couponDiscountCents = 0;
    if (validated.coupon_code) {
      // Calculate total first (simplified - you should calculate from items)
      const totalCents = validated.items.reduce((sum, item) => {
        // This is a simplified calculation - you should get actual product prices
        return sum + (item.quantity * 10000); // Placeholder
      }, 0);

      const couponResult = await validateCoupon(db, validated.coupon_code, totalCents, customerId);
      couponId = couponResult.coupon.id;
      couponDiscountCents = couponResult.discount_cents;
    }

    // Create order
    const order = await createOrder(db, {
      ...validated,
      customer_id: customerId,
      coupon_id: couponId,
      coupon_code: validated.coupon_code || null,
      coupon_discount_cents: couponDiscountCents,
    });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total_cents,
      currency: 'brl',
      metadata: {
        order_id: order.id.toString(),
        order_number: order.order_number,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    await updateOrderPayment(db, order.id, paymentIntent.id);

    // Apply coupon usage if used
    if (couponId) {
      await applyCoupon(db, couponId, order.id, customerId);
    }

    return successResponse({
      order_id: order.id,
      order_number: order.order_number,
      client_secret: paymentIntent.client_secret,
      total_cents: order.total_cents,
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

