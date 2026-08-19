import type { Env } from '../../types';
import { getDb, executeRun, executeOne } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth, requireAdmin } from '../../utils/auth';
import {
  createOrder,
  getOrder,
  getOrderByNumber,
  listOrders,
  updateOrder,
} from '../../modules/orders';
import { createOrderSchema, updateOrderSchema, listOrdersSchema } from '../../validators/orders';

export async function handleOrdersRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // List orders: GET /api/orders
    if (method === 'GET' && path === '/api/orders') {
      const user = await requireAuth(request, env);
      const params = Object.fromEntries(url.searchParams.entries());
      const validated = listOrdersSchema.parse(params);

      const db = getDb(env);

      // If customer, only show their orders
      if (user.type === 'customer') {
        validated.customer_id = user.id;
      }

      // Log para debug
      console.log(`[API] List orders - user type: ${user.type}, filters:`, validated);

      const result = await listOrders(db, validated);

      // Log para debug
      console.log(`[API] Found ${result.items?.length || 0} orders, total: ${result.total}`);

      return successResponse({
        items: result.items,
        total: result.total,
        page: validated.page,
        pageSize: validated.pageSize,
        totalPages: Math.ceil(result.total / validated.pageSize),
      });
    }

    // Update shipping address: PUT /api/orders/:id/shipping
    if (method === 'PUT' && path.match(/^\/api\/orders\/\d+\/shipping$/)) {
      const segments = path.split('/');
      const id = parseInt(segments[3] || '0');
      const db = getDb(env);
      let authUser: { type: 'admin' | 'customer'; id: number } | null = null;

      try {
        authUser = await requireAuth(request, env);
      } catch {
        // Permitir fallback via payment_intent_id (para guest checkout)
      }

      const body = await request.json() as {
        shipping_address?: any;
        payment_intent_id?: string;
        address_id?: number;
      };
      const shippingAddress = body.shipping_address;
      const addressIdFromBody = body.address_id;
      const paymentIntentId = body.payment_intent_id;

      const order = await getOrder(db, id);
      if (!order) {
        return notFoundResponse('Order not found');
      }

      let authorized = false;
      if (authUser) {
        if (authUser.type === 'admin') {
          authorized = true;
        } else if (authUser.type === 'customer' && order.customer_id === authUser.id) {
          authorized = true;
        }
      } else if (paymentIntentId && order.stripe_payment_intent_id === paymentIntentId) {
        authorized = true;
      }

      if (!authorized) {
        return errorResponse('Authentication required', 401);
      }

      let resolvedAddress = shippingAddress;
      const shippingAddressId = addressIdFromBody || null;

      if (addressIdFromBody) {
        if (!order.customer_id) {
          return errorResponse('Pedido não possui cliente associado para atualizar endereço salvo', 400);
        }

        const savedAddress = await executeOne(
          db,
          'SELECT * FROM addresses WHERE id = ? AND customer_id = ?',
          [addressIdFromBody, order.customer_id]
        );

        if (!savedAddress) {
          return errorResponse('Endereço selecionado não encontrado', 404);
        }

        resolvedAddress = {
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
      }

      if (!resolvedAddress) {
        return errorResponse('Shipping address is required', 400);
      }

      await executeRun(
        db,
        'UPDATE orders SET shipping_address_json = ?, shipping_address_id = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [JSON.stringify(resolvedAddress), shippingAddressId, id]
      );

      return successResponse({ updated: true });
    }

    // Get order: GET /api/orders/:id
    if (method === 'GET' && path.match(/^\/api\/orders\/\d+$/)) {
      const user = await requireAuth(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);

      // Verificar se deve incluir itens (query param include=items)
      const includeItems = url.searchParams.get('include') === 'items';
      const order = await getOrder(db, id, includeItems);

      if (!order) {
        return notFoundResponse('Order not found');
      }

      // Check if customer can access this order
      if (user.type === 'customer' && order.customer_id !== user.id) {
        return errorResponse('Forbidden', 403);
      }

      return successResponse(order);
    }

    // Get order by number: GET /api/orders/number/:number
    if (method === 'GET' && path.match(/^\/api\/orders\/number\/[^/]+$/)) {
      const orderNumber = path.split('/').pop() || '';
      const db = getDb(env);
      const order = await getOrderByNumber(db, orderNumber);

      if (!order) {
        return notFoundResponse('Order not found');
      }

      return successResponse(order);
    }

    // Get invoice: GET /api/orders/:id/invoice
    if (method === 'GET' && path.match(/^\/api\/orders\/\d+\/invoice$/)) {
      const { handleGetInvoice } = await import('./invoice');
      return await handleGetInvoice(request, env);
    }

    // Get shipping slip: GET /api/orders/:id/shipping-slip
    if (method === 'GET' && path.match(/^\/api\/orders\/\d+\/shipping-slip$/)) {
      const { handleGetShippingSlip } = await import('./shipping-slip');
      return await handleGetShippingSlip(request, env);
    }

    // Resend confirmation email: POST /api/orders/:id/resend-email
    if (method === 'POST' && path.match(/^\/api\/orders\/\d+\/resend-email$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      
      const order = await getOrder(db, id, true);
      if (!order) {
        return notFoundResponse('Order not found');
      }

      if (!order.email) {
        return errorResponse('Order has no email address', 400);
      }

      try {
        // Parse shipping address from JSON
        let shippingAddressObj = null;
        try {
          if (order.shipping_address_json) {
            shippingAddressObj = typeof order.shipping_address_json === 'string'
              ? JSON.parse(order.shipping_address_json)
              : order.shipping_address_json;
          }
        } catch (e) {
          console.error('Error parsing shipping address for email:', e);
        }

        const { sendEmail, generateOrderConfirmationEmail } = await import('../../utils/email');
        
        const emailHtml = generateOrderConfirmationEmail({
          order_number: order.order_number,
          total_cents: order.total_cents,
          items: order.items?.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price_cents: item.price_cents,
            image_url: item.image_url
          })) || [],
          customer_name: shippingAddressObj
            ? `${shippingAddressObj.first_name} ${shippingAddressObj.last_name}`
            : order.email.split('@')[0],
          shipping_address: shippingAddressObj ? {
            street: `${shippingAddressObj.address_line1}${shippingAddressObj.address_line2 ? ' ' + shippingAddressObj.address_line2 : ''}`,
            city: shippingAddressObj.city,
            postal_code: shippingAddressObj.postal_code,
            country: shippingAddressObj.country
          } : undefined
        });

        console.log(`[API] Reenviando email de confirmação para pedido #${order.order_number} (${order.email})`);
        const emailSent = await sendEmail(env, {
          to: order.email,
          subject: `Pedido Confirmado #${order.order_number} - Leiasabores`,
          html: emailHtml,
        });

        if (emailSent) {
          // Log sucesso
          try {
            await executeRun(
              db,
              'INSERT INTO order_email_logs (order_id, email, email_type, status, sent_at, created_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
              [id, order.email, 'confirmation', 'sent']
            );
          } catch (logError) {
            console.error('[API] Erro ao salvar log de email:', logError);
          }
          
          return successResponse({ sent: true, message: 'Email sent successfully' });
        } else {
          // Log falha
          try {
            await executeRun(
              db,
              'INSERT INTO order_email_logs (order_id, email, email_type, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
              [id, order.email, 'confirmation', 'failed', 'Email sending failed - check MailChannels logs']
            );
          } catch (logError) {
            console.error('[API] Erro ao salvar log de email:', logError);
          }
          
          return errorResponse('Failed to send email', 500);
        }
      } catch (error: any) {
        console.error('[API] Error resending confirmation email:', error);
        return errorResponse(error.message || 'Failed to send email', 500);
      }
    }

    // Create order: POST /api/orders
    if (method === 'POST' && path === '/api/orders') {
      const body = await request.json();
      const validated = createOrderSchema.parse(body);
      const db = getDb(env);

      // Try to get customer from auth, but allow guest checkout
      let customerId: number | null = null;
      try {
        const user = await requireAuth(request, env, 'customer');
        customerId = user.id;
      } catch {
        // Guest checkout
      }

      const order = await createOrder(db, {
        ...validated,
        customer_id: customerId || validated.customer_id,
      });

      return successResponse(order, 'Order created successfully');
    }

    // Update order: PUT /api/orders/:id
    if (method === 'PUT' && path.match(/^\/api\/orders\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const body = await request.json();
      const validated = updateOrderSchema.parse(body);
      const db = getDb(env);
      const order = await updateOrder(db, id, validated);
      return successResponse(order, 'Order updated successfully');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

