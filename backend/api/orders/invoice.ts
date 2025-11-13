import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import { getOrder } from '../../modules/orders';
import { executeQuery } from '../../utils/db';
import { generateInvoiceHTML } from '../../utils/pdf';

/**
 * GET /api/orders/:id/invoice
 * Generate invoice HTML/PDF for an order
 */
export async function handleGetInvoice(request: Request, env: Env): Promise<Response> {
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

    // Check permissions: customer can only see their own orders, admin can see all
    if (user.type === 'customer' && order.customer_id !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Get order items
    const orderItems = await executeQuery<{
      title: string;
      quantity: number;
      price_cents: number;
      total_cents: number;
    }>(
      db,
      `SELECT 
        p.title,
        oi.quantity,
        oi.price_cents,
        (oi.quantity * oi.price_cents) as total_cents
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    // Parse shipping address from JSON
    let shippingAddress = {
      street: '',
      city: '',
      postal_code: '',
      country: '',
    };
    if (order.shipping_address_json) {
      try {
        const addr = typeof order.shipping_address_json === 'string' 
          ? JSON.parse(order.shipping_address_json)
          : order.shipping_address_json;
        shippingAddress = {
          street: addr.street || addr.address_line1 || '',
          city: addr.city || '',
          postal_code: addr.postal_code || '',
          country: addr.country || '',
        };
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
    }

    const invoiceData = {
      order_number: order.order_number,
      order_date: order.created_at,
      customer_name: order.email.split('@')[0],
      customer_email: order.email,
      shipping_address: shippingAddress,
      items: orderItems.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price_cents: item.price_cents,
        total_cents: item.total_cents,
      })),
      subtotal_cents: order.subtotal_cents,
      tax_cents: order.tax_cents,
      shipping_cents: order.shipping_cents,
      discount_cents: order.discount_cents,
      total_cents: order.total_cents,
    };

    const html = generateInvoiceHTML(invoiceData);

    // Return HTML invoice (client can print to PDF or use jsPDF)
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

