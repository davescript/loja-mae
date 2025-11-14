import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import {
  addFavorite,
  removeFavorite,
  getCustomerFavorites,
  isFavorite,
  getCustomerFavoritesWithProducts,
} from '../../modules/favorites';

/**
 * GET /api/favorites - Lista favoritos do cliente autenticado
 * POST /api/favorites - Adiciona produto aos favoritos
 * DELETE /api/favorites/:productId - Remove produto dos favoritos
 */
export async function handleFavoritesRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const db = getDb(env);
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    // Requer autenticação de cliente
    const user = await requireAuth(request, env, 'customer');
    if (user.type !== 'customer') {
      return errorResponse('Authentication required', 401);
    }

    const customerId = user.id;

    // GET /api/favorites - Lista favoritos
    if (method === 'GET' && path === '/api/favorites') {
      const includeProducts = url.searchParams.get('include') === 'products';

      if (includeProducts) {
        // Retornar favoritos com detalhes do produto
        const favorites = await getCustomerFavoritesWithProducts(db, customerId);
        return successResponse({ favorites });
      } else {
        // Retornar apenas IDs dos produtos
        const productIds = await getCustomerFavorites(db, customerId);
        return successResponse({ favorites: productIds });
      }
    }

    // POST /api/favorites - Adiciona favorito
    if (method === 'POST' && path === '/api/favorites') {
      const body = await request.json() as { product_id?: number };
      const { product_id } = body;

      if (!product_id || typeof product_id !== 'number') {
        return errorResponse('product_id is required', 400);
      }

      try {
        const favorite = await addFavorite(db, customerId, product_id);
        return successResponse({ favorite, message: 'Product added to favorites' });
      } catch (error: any) {
        if (error.message?.includes('FOREIGN KEY')) {
          return errorResponse('Product not found', 404);
        }
        throw error;
      }
    }

    // DELETE /api/favorites/:productId - Remove favorito
    if (method === 'DELETE' && path.startsWith('/api/favorites/')) {
      const productId = parseInt(path.split('/').pop() || '0');

      if (!productId || isNaN(productId)) {
        return errorResponse('Invalid product ID', 400);
      }

      const removed = await removeFavorite(db, customerId, productId);

      if (!removed) {
        return errorResponse('Favorite not found', 404);
      }

      return successResponse({ message: 'Product removed from favorites' });
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

