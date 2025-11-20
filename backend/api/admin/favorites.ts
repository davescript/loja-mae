import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import {
  getAllFavoritesWithProducts,
  getFavoritesCount,
  getCustomerFavoritesWithProducts,
} from '../../modules/favorites';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

function withNoCache(response: Response): Response {
  Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * GET /api/admin/favorites - Lista todos os favoritos (admin)
 * GET /api/admin/favorites/customer/:customerId - Lista favoritos de um cliente específico
 */
export async function handleAdminFavoritesRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);

    const db = getDb(env);
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/admin/favorites - Lista todos os favoritos
    if (method === 'GET' && path === '/api/admin/favorites') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const [favorites, total] = await Promise.all([
        getAllFavoritesWithProducts(db, limit, offset),
        getFavoritesCount(db),
      ]);

      return withNoCache(successResponse({
        favorites,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      }));
    }

    // GET /api/admin/favorites/customer/:customerId - Lista favoritos de um cliente
    if (method === 'GET' && path.startsWith('/api/admin/favorites/customer/')) {
      const customerId = parseInt(path.split('/').pop() || '0');

      if (!customerId || isNaN(customerId)) {
        return errorResponse('Invalid customer ID', 400);
      }

      const favorites = await getCustomerFavoritesWithProducts(db, customerId);

      return withNoCache(successResponse({ favorites }));
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

