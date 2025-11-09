import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { listProducts } from '../../modules/products';
import { listProductsSchema } from '../../validators/products';

export async function handleListProducts(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const validated = listProductsSchema.parse(params);
    const db = getDb(env);
    
    const result = await listProducts(db, validated);
    
    return successResponse({
      items: result.items,
      total: result.total,
      page: validated.page,
      pageSize: validated.pageSize,
      totalPages: Math.ceil(result.total / validated.pageSize),
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

