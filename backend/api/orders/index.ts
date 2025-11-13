import type { Env } from '../../types';
import { getDb } from '../../utils/db';
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

    // Get order: GET /api/orders/:id
    if (method === 'GET' && path.match(/^\/api\/orders\/\d+$/)) {
      const user = await requireAuth(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      const order = await getOrder(db, id, true);

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

