import type { Env } from '../types';
import { handleCORS } from '../utils/cors';
import { handleError } from '../utils/errors';
import { errorResponse, successResponse } from '../utils/response';

// Import route handlers
import { handleProductsRoutes } from './products';
import { handleCategoriesRoutes } from './categories';
import { handleOrdersRoutes } from './orders';
import { handleCustomersRoutes } from './customers';
import { handleCouponsRoutes } from './coupons';
import { handleAuthRoutes } from './auth';
import { handleStripeRoutes } from './stripe';

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return handleCORS(new Response(null, { status: 204 }), env);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // API routes
    if (path.startsWith('/api/products')) {
      return handleCORS(await handleProductsRoutes(request, env), env);
    }

    if (path.startsWith('/api/categories')) {
      return handleCORS(await handleCategoriesRoutes(request, env), env);
    }

    if (path.startsWith('/api/orders')) {
      return handleCORS(await handleOrdersRoutes(request, env), env);
    }

    if (path.startsWith('/api/customers')) {
      return handleCORS(await handleCustomersRoutes(request, env), env);
    }

    if (path.startsWith('/api/coupons')) {
      return handleCORS(await handleCouponsRoutes(request, env), env);
    }

    if (path.startsWith('/api/auth')) {
      return handleCORS(await handleAuthRoutes(request, env), env);
    }

    if (path.startsWith('/api/stripe')) {
      return handleCORS(await handleStripeRoutes(request, env), env);
    }

    // Cart routes
    if (path.startsWith('/api/cart')) {
      return handleCORS(await handleCartRoutes(request, env), env);
    }

    // Favorites routes
    if (path.startsWith('/api/favorites')) {
      return handleCORS(await handleFavoritesRoutes(request, env), env);
    }

    // Health check
    if (path === '/api/health') {
      return successResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Root endpoint - API information
    if (path === '/' || path === '/api') {
      return successResponse({
        name: 'Loja Mãe API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
          health: '/api/health',
          products: '/api/products',
          categories: '/api/categories',
          orders: '/api/orders',
          customers: '/api/customers',
          coupons: '/api/coupons',
          auth: '/api/auth',
          stripe: '/api/stripe',
        },
        documentation: 'https://github.com/davescript/loja-mae',
      });
    }

    // 404
    return errorResponse('Not found', 404);
  } catch (error) {
    console.error('Request error:', error);
    const { message, status, details } = handleError(error);
    return handleCORS(errorResponse(message, status, details), env);
  }
}

async function handleCartRoutes(request: Request, env: Env): Promise<Response> {
  // TODO: Implement cart routes
  return errorResponse('Cart routes not implemented yet', 501);
}

async function handleFavoritesRoutes(request: Request, env: Env): Promise<Response> {
  // TODO: Implement favorites routes
  return errorResponse('Favorites routes not implemented yet', 501);
}

