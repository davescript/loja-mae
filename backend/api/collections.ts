import type { Env } from '../types';
import { getDb, executeQuery, executeOne } from '../utils/db';
import { successResponse, errorResponse } from '../utils/response';
import { handleError } from '../utils/errors';

export async function handleCollectionsRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const db = getDb(env);
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // GET /api/collections - List active collections
    if (method === 'GET' && path === '/api/collections') {
      const collections = await executeQuery(
        db,
        `SELECT 
          c.*,
          COUNT(DISTINCT cp.product_id) as product_count
        FROM collections c
        LEFT JOIN collection_products cp ON c.id = cp.collection_id
        WHERE c.is_active = 1
        GROUP BY c.id
        ORDER BY c.created_at DESC`
      );

      return successResponse(collections || []);
    }

    // GET /api/collections/:slug - Get collection by slug with products
    if (method === 'GET' && path.match(/^\/api\/collections\/[^/]+$/)) {
      const slug = path.split('/').pop() || '';

      const collection = await executeOne(
        db,
        'SELECT * FROM collections WHERE slug = ? AND is_active = 1',
        [slug]
      );

      if (!collection) {
        return errorResponse('Coleção não encontrada', 404);
      }

      // Buscar produtos da coleção
      const products = await executeQuery(
        db,
        `SELECT p.* FROM products p
         INNER JOIN collection_products cp ON p.id = cp.product_id
         WHERE cp.collection_id = ? AND p.is_active = 1
         ORDER BY cp.position`,
        [collection.id]
      );

      collection.products = products || [];

      return successResponse(collection);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

