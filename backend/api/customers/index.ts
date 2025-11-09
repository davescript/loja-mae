import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth, requireAdmin } from '../../utils/auth';
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
      return successResponse(customer);
    }

    // Get my profile: GET /api/customers/me
    if (method === 'GET' && path === '/api/customers/me') {
      const user = await requireAuth(request, env, 'customer');
      const db = getDb(env);
      const customer = await getCustomer(db, user.id);
      if (!customer) {
        return notFoundResponse('Customer not found');
      }
      return successResponse(customer);
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

