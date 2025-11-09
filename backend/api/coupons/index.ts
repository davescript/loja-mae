import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import {
  createCoupon,
  getCoupon,
  getCouponByCode,
  validateCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
} from '../../modules/coupons';
import { createCouponSchema, updateCouponSchema, listCouponsSchema, applyCouponSchema } from '../../validators/coupons';

export async function handleCouponsRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // List coupons: GET /api/coupons (admin only)
    if (method === 'GET' && path === '/api/coupons') {
      await requireAdmin(request, env);
      const params = Object.fromEntries(url.searchParams.entries());
      const validated = listCouponsSchema.parse(params);
      const db = getDb(env);
      const result = await listCoupons(db, validated);
      return successResponse({
        items: result.items,
        total: result.total,
        page: validated.page,
        pageSize: validated.pageSize,
        totalPages: Math.ceil(result.total / validated.pageSize),
      });
    }

    // Get coupon: GET /api/coupons/:id
    if (method === 'GET' && path.match(/^\/api\/coupons\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      const coupon = await getCoupon(db, id);
      if (!coupon) {
        return notFoundResponse('Coupon not found');
      }
      return successResponse(coupon);
    }

    // Validate coupon: POST /api/coupons/validate
    if (method === 'POST' && path === '/api/coupons/validate') {
      const body = await request.json();
      const validated = applyCouponSchema.parse(body);
      const db = getDb(env);

      // Try to get customer from auth (optional)
      let customerId: number | null = null;
      try {
        const { requireAuth } = await import('../../utils/auth');
        const user = await requireAuth(request, env, 'customer');
        customerId = user.id;
      } catch {
        // Guest checkout
      }

      const result = await validateCoupon(db, validated.code, validated.total_cents, customerId);
      return successResponse(result);
    }

    // Create coupon: POST /api/coupons
    if (method === 'POST' && path === '/api/coupons') {
      await requireAdmin(request, env);
      const body = await request.json();
      const validated = createCouponSchema.parse(body);
      const db = getDb(env);
      const coupon = await createCoupon(db, validated);
      return successResponse(coupon, 'Coupon created successfully');
    }

    // Update coupon: PUT /api/coupons/:id
    if (method === 'PUT' && path.match(/^\/api\/coupons\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const body = await request.json();
      const validated = updateCouponSchema.parse(body);
      const db = getDb(env);
      const coupon = await updateCoupon(db, id, validated);
      return successResponse(coupon, 'Coupon updated successfully');
    }

    // Delete coupon: DELETE /api/coupons/:id
    if (method === 'DELETE' && path.match(/^\/api\/coupons\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      await deleteCoupon(db, id);
      return successResponse(null, 'Coupon deleted successfully');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

