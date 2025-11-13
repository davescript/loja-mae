import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth, requireAdmin } from '../../utils/auth';
import { executeQuery } from '../../utils/db';
import type { Address } from '@shared/types';
import {
  getCustomer,
  listCustomers,
  updateCustomer,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../modules/customers';
import { updateCustomerSchema, listCustomersSchema, createAddressSchema, updateAddressSchema } from '../../validators/customers';
import * as portalHandlers from './portal';

export async function handleCustomersRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // List customers: GET /api/customers (admin only)
    if (method === 'GET' && path === '/api/customers') {
      await requireAdmin(request, env);
      const params = Object.fromEntries(url.searchParams.entries());
      const validated = listCustomersSchema.parse(params);
      const db = getDb(env);
      const result = await listCustomers(db, validated);
      return successResponse({
        items: result.items,
        total: result.total,
        page: validated.page,
        pageSize: validated.pageSize,
        totalPages: Math.ceil(result.total / validated.pageSize),
      });
    }

    // Get customer: GET /api/customers/:id
    if (method === 'GET' && path.match(/^\/api\/customers\/\d+$/)) {
      const user = await requireAuth(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);

      // Customers can only view their own profile
      if (user.type === 'customer' && user.id !== id) {
        return errorResponse('Forbidden', 403);
      }

      const customer = await getCustomer(db, id);
      if (!customer) {
        return notFoundResponse('Customer not found');
      }

      // Get customer addresses
      const addresses = await executeQuery<Address>(
        db,
        'SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC',
        [id]
      );

      // Log para debug
      console.log(`[API] Cliente ${id} - Endereços encontrados:`, addresses?.length || 0);

      return successResponse({
        ...customer,
        addresses: addresses || [],
      });
    }

    // Portal routes - Customer self-service
    // GET /api/customers/me
    if (method === 'GET' && path === '/api/customers/me') {
      return await portalHandlers.handleGetMe(request, env);
    }

    // PUT /api/customers/me
    if (method === 'PUT' && path === '/api/customers/me') {
      return await portalHandlers.handleUpdateMe(request, env);
    }

    // PUT /api/customers/me/password
    if (method === 'PUT' && path === '/api/customers/me/password') {
      return await portalHandlers.handleUpdatePassword(request, env);
    }

    // GET /api/customers/stats
    if (method === 'GET' && path === '/api/customers/stats') {
      return await portalHandlers.handleGetStats(request, env);
    }

    // GET /api/customers/orders
    if (method === 'GET' && path === '/api/customers/orders') {
      return await portalHandlers.handleGetOrders(request, env);
    }

    // GET /api/customers/orders/:orderNumber
    if (method === 'GET' && path.match(/^\/api\/customers\/orders\/[A-Z0-9-]+$/)) {
      const orderNumber = path.split('/').pop() || '';
      return await portalHandlers.handleGetOrder(request, env, orderNumber);
    }

    // GET /api/customers/addresses
    if (method === 'GET' && path === '/api/customers/addresses') {
      return await portalHandlers.handleGetAddresses(request, env);
    }

    // POST /api/customers/addresses
    if (method === 'POST' && path === '/api/customers/addresses') {
      return await portalHandlers.handleCreateAddress(request, env);
    }

    // PUT /api/customers/addresses/:id
    if (method === 'PUT' && path.match(/^\/api\/customers\/addresses\/\d+$/)) {
      const addressId = path.split('/').pop() || '';
      return await portalHandlers.handleUpdateAddress(request, env, addressId);
    }

    // DELETE /api/customers/addresses/:id
    if (method === 'DELETE' && path.match(/^\/api\/customers\/addresses\/\d+$/)) {
      const addressId = path.split('/').pop() || '';
      return await portalHandlers.handleDeleteAddress(request, env, addressId);
    }

    // GET /api/customers/payments
    if (method === 'GET' && path === '/api/customers/payments') {
      return await portalHandlers.handleGetPayments(request, env);
    }

    // GET /api/customers/notifications
    if (method === 'GET' && path === '/api/customers/notifications') {
      return await portalHandlers.handleGetNotifications(request, env);
    }

    // GET /api/customers/notifications/unread-count
    if (method === 'GET' && path === '/api/customers/notifications/unread-count') {
      return await portalHandlers.handleGetUnreadCount(request, env);
    }

    // PUT /api/customers/notifications/:id/read
    if (method === 'PUT' && path.match(/^\/api\/customers\/notifications\/\d+\/read$/)) {
      const notificationId = path.split('/')[3] || '';
      return await portalHandlers.handleMarkNotificationRead(request, env, notificationId);
    }

    // PUT /api/customers/notifications/read-all
    if (method === 'PUT' && path === '/api/customers/notifications/read-all') {
      return await portalHandlers.handleMarkAllNotificationsRead(request, env);
    }

    // GET /api/customers/support/tickets
    if (method === 'GET' && path === '/api/customers/support/tickets') {
      return await portalHandlers.handleGetSupportTickets(request, env);
    }

    // POST /api/customers/support/tickets
    if (method === 'POST' && path === '/api/customers/support/tickets') {
      return await portalHandlers.handleCreateSupportTicket(request, env);
    }

    // Update customer: PUT /api/customers/:id or PUT /api/customers/me
    if (method === 'PUT' && (path.match(/^\/api\/customers\/\d+$/) || path === '/api/customers/me')) {
      const user = await requireAuth(request, env, 'customer');
      const db = getDb(env);
      const body = await request.json();
      const validated = updateCustomerSchema.parse(body);

      const customerId = path === '/api/customers/me' ? user.id : parseInt(path.split('/').pop() || '0');

      // Customers can only update their own profile
      if (user.id !== customerId) {
        return errorResponse('Forbidden', 403);
      }

      const customer = await updateCustomer(db, customerId, validated);
      return successResponse(customer, 'Customer updated successfully');
    }

    // Get addresses: GET /api/customers/me/addresses
    if (method === 'GET' && path === '/api/customers/me/addresses') {
      const user = await requireAuth(request, env, 'customer');
      const db = getDb(env);
      const addresses = await getAddresses(db, user.id);
      return successResponse(addresses);
    }

    // Create address: POST /api/customers/me/addresses
    if (method === 'POST' && path === '/api/customers/me/addresses') {
      const user = await requireAuth(request, env, 'customer');
      const db = getDb(env);
      const body = await request.json();
      const validated = createAddressSchema.parse(body);
      const address = await createAddress(db, user.id, validated);
      return successResponse(address, 'Address created successfully');
    }

    // Update address: PUT /api/customers/me/addresses/:id
    if (method === 'PUT' && path.match(/^\/api\/customers\/me\/addresses\/\d+$/)) {
      const user = await requireAuth(request, env, 'customer');
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      const body = await request.json();
      const validated = updateAddressSchema.parse(body);
      const address = await updateAddress(db, id, user.id, validated);
      return successResponse(address, 'Address updated successfully');
    }

    // Delete address: DELETE /api/customers/me/addresses/:id
    if (method === 'DELETE' && path.match(/^\/api\/customers\/me\/addresses\/\d+$/)) {
      const user = await requireAuth(request, env, 'customer');
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      await deleteAddress(db, id, user.id);
      return successResponse(null, 'Address deleted successfully');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

