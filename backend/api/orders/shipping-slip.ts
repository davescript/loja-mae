import type { Env } from '../../types';
import { getDb, executeQuery, executeOne } from '../../utils/db';
import { errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import { getOrder } from '../../modules/orders';
import { generateShippingSlipHTML } from '../../utils/pdf';

/**
 * GET /api/orders/:id/shipping-slip
 * Generate shipping slip HTML for admin use (print & take to post office)
 */
export async function handleGetShippingSlip(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'both');
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = parseInt(pathParts[pathParts.length - 2]);

    if (isNaN(orderId)) {
      return errorResponse('Invalid order ID', 400);
    }

    const db = getDb(env);
    const order = await getOrder(db, orderId, true);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Customers can only see their own orders
    if (user.type === 'customer') {
      if (order.customer_id !== user.id && order.email !== user.email) {
        return errorResponse('Unauthorized', 403);
      }
    }

    const orderItems = await executeQuery<{
      title: string;
      quantity: number;
      price_cents: number;
    }>(
      db,
      `SELECT p.title, oi.quantity, oi.price_cents
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    let shippingAddress: any = {
      first_name: '', last_name: '', address_line1: '', address_line2: '',
      city: '', postal_code: '', state: '', country: 'PT', phone: '',
    };
    if (order.shipping_address_json) {
      try {
        const addr = typeof order.shipping_address_json === 'string'
          ? JSON.parse(order.shipping_address_json)
          : order.shipping_address_json;
        shippingAddress = {
          first_name: addr.first_name || '',
          last_name: addr.last_name || '',
          address_line1: addr.address_line1 || addr.street || '',
          address_line2: addr.address_line2 || '',
          city: addr.city || '',
          postal_code: addr.postal_code || '',
          state: addr.state || '',
          country: addr.country || 'PT',
          phone: addr.phone || '',
        };
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
    }

    let customerName = order.email.split('@')[0];
    let customerPhone = '';
    if (order.customer_id) {
      try {
        const customer = await executeOne<{ first_name: string; last_name: string; phone: string | null }>(
          db,
          'SELECT first_name, last_name, phone FROM customers WHERE id = ?',
          [order.customer_id]
        );
        if (customer?.first_name) {
          customerName = `${customer.first_name} ${customer.last_name || ''}`.trim();
        }
        customerPhone = customer?.phone || '';
      } catch (e) {
        console.error('Error fetching customer:', e);
      }
    }

    const html = generateShippingSlipHTML({
      order_number: order.order_number,
      order_date: order.created_at,
      customer_name: customerName,
      customer_email: order.email,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      items: orderItems,
      total_cents: order.total_cents,
      notes: order.notes,
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}
