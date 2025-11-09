import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { getProduct, getProductBySlug } from '../../modules/products';

export async function handleGetProduct(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const identifier = pathParts[pathParts.length - 1];
    
    const db = getDb(env);
    const includeRelations = url.searchParams.get('include') === 'all';
    
    // Try as ID first, then as slug
    let product = null;
    const id = parseInt(identifier);
    if (!isNaN(id)) {
      product = await getProduct(db, id, includeRelations);
    } else {
      product = await getProductBySlug(db, identifier, includeRelations);
    }
    
    if (!product) {
      return notFoundResponse('Product not found');
    }
    
    return successResponse(product);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

