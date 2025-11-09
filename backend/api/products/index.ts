import type { Env } from '../../types';
import { handleListProducts } from './list';
import { handleGetProduct } from './get';
import { handleCreateProduct } from './create';
import { handleUpdateProduct } from './update';
import { handleDeleteProduct } from './delete';

export async function handleProductsRoutes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  // List products: GET /api/products
  if (method === 'GET' && path === '/api/products') {
    return handleListProducts(request, env);
  }

  // Get product: GET /api/products/:id or /api/products/:slug
  if (method === 'GET' && path.match(/^\/api\/products\/[^/]+$/)) {
    return handleGetProduct(request, env);
  }

  // Create product: POST /api/products
  if (method === 'POST' && path === '/api/products') {
    return handleCreateProduct(request, env);
  }

  // Update product: PUT /api/products/:id
  if (method === 'PUT' && path.match(/^\/api\/products\/\d+$/)) {
    return handleUpdateProduct(request, env);
  }

  // Delete product: DELETE /api/products/:id
  if (method === 'DELETE' && path.match(/^\/api\/products\/\d+$/)) {
    return handleDeleteProduct(request, env);
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

