import type { Env } from '../types';
import { handleCORS } from '../utils/cors';
import { handleError } from '../utils/errors';
import { errorResponse, successResponse } from '../utils/response';
import { verifyCSRF, shouldVerifyCSRF } from '../utils/csrf';

// Import route handlers
import { handleProductsRoutes } from './products';
import { handleCategoriesRoutes } from './categories';
import { handleOrdersRoutes } from './orders';
import { handleCustomersRoutes } from './customers';
import { handleCouponsRoutes } from './coupons';
import { handleAuthRoutes } from './auth';
import { handleStripeRoutes } from './stripe';
import { handleBlogRoutes } from './blog';
import { handleImageRequest } from './images';
import { handleChatRoutes } from './chat';
import { handleCartRoutes } from './cart';

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return handleCORS(new Response(null, { status: 204 }), env, request);
  }

  // Verify CSRF for state-changing requests
  if (shouldVerifyCSRF(request) && !verifyCSRF(request, env)) {
    return handleCORS(
      errorResponse('Invalid origin. CSRF verification failed.', 403),
      env,
      request
    );
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // API routes
    if (path.startsWith('/api/products')) {
      return handleCORS(await handleProductsRoutes(request, env), env, request);
    }

    if (path.startsWith('/api/categories')) {
      return handleCORS(await handleCategoriesRoutes(request, env), env, request);
    }

    if (path.startsWith('/api/orders')) {
      // Sync payment status endpoint
      if (path === '/api/orders/sync-payment' && method === 'POST') {
        const { handleSyncPaymentStatus } = await import('./orders/sync-payment');
        return handleCORS(await handleSyncPaymentStatus(request, env), env, request);
      }
      return handleCORS(await handleOrdersRoutes(request, env), env, request);
    }

    if (path.startsWith('/api/customers')) {
      return handleCORS(await handleCustomersRoutes(request, env), env, request);
    }

    if (path.startsWith('/api/coupons')) {
      return handleCORS(await handleCouponsRoutes(request, env), env, request);
    }

    // Cart routes (including abandoned carts)
    if (path.startsWith('/api/cart')) {
      return handleCORS(await handleCartRoutes(request, env), env, request);
    }

    // Admin abandoned carts routes
    if (path.startsWith('/api/admin/carts/abandoned')) {
      const { handleListAbandonedCarts, handleGetAbandonedCart, handleSendRecoveryEmail } = await import('./cart/abandoned');
      if (method === 'GET' && path === '/api/admin/carts/abandoned') {
        return handleCORS(await handleListAbandonedCarts(request, env), env, request);
      }
      if (method === 'GET' && path.match(/^\/api\/admin\/carts\/abandoned\/[^/]+$/)) {
        const cartId = path.split('/').pop() || '';
        return handleCORS(await handleGetAbandonedCart(request, env, cartId), env, request);
      }
      if (method === 'POST' && path.match(/^\/api\/admin\/carts\/abandoned\/[^/]+\/send-email$/)) {
        const cartId = path.split('/')[4] || '';
        return handleCORS(await handleSendRecoveryEmail(request, env, cartId), env, request);
      }
    }

    // Mark abandoned carts (CRON endpoint)
    if (path === '/api/cart/mark-abandoned' && method === 'POST') {
      const { handleMarkAbandoned } = await import('./cart/abandoned');
      return handleCORS(await handleMarkAbandoned(request, env), env, request);
    }

    if (path.startsWith('/api/auth')) {
      return handleCORS(await handleAuthRoutes(request, env), env, request);
    }

    if (path.startsWith('/api/stripe')) {
      return handleCORS(await handleStripeRoutes(request, env), env, request);
    }

    if (path.startsWith('/api/blog') || path.startsWith('/api/admin/blog')) {
      return handleCORS(await handleBlogRoutes(request, env), env, request);
    }

        // Image serving (R2 proxy)
        if (path.startsWith('/api/images')) {
          return await handleImageRequest(request, env);
        }

        // Chat routes
        if (path.startsWith('/api/chat')) {
          return handleCORS(await handleChatRoutes(request, env), env, request);
        }

        // Admin Dashboard routes
        if (path.startsWith('/api/admin/dashboard')) {
          const { handleGetDashboardStats, handleGetSalesChart, handleGetTopProducts } = await import('./admin/dashboard');
          if (path === '/api/admin/dashboard/stats') {
            return handleCORS(await handleGetDashboardStats(request, env), env, request);
          }
          if (path === '/api/admin/dashboard/sales-chart') {
            return handleCORS(await handleGetSalesChart(request, env), env, request);
          }
          if (path === '/api/admin/dashboard/top-products') {
            return handleCORS(await handleGetTopProducts(request, env), env, request);
          }
        }

        // Admin Analytics routes
        if (path.startsWith('/api/admin/analytics')) {
          const { handleGetAnalyticsStats, handleGetRevenueChart, handleGetAnalyticsTopProducts } = await import('./admin/analytics');
          if (path === '/api/admin/analytics/stats') {
            return handleCORS(await handleGetAnalyticsStats(request, env), env, request);
          }
          if (path === '/api/admin/analytics/revenue-chart') {
            return handleCORS(await handleGetRevenueChart(request, env), env, request);
          }
          if (path === '/api/admin/analytics/top-products') {
            return handleCORS(await handleGetAnalyticsTopProducts(request, env), env, request);
          }
        }

        // Admin orders updates endpoint for polling
        if (path === '/api/admin/orders/updates' && method === 'GET') {
          const { handleGetOrderUpdates } = await import('./admin/orders/updates');
          return handleCORS(await handleGetOrderUpdates(request, env), env, request);
        }

        // Admin orders tracking endpoints
        if (path.match(/^\/api\/admin\/orders\/\d+\/tracking$/)) {
          const orderId = path.split('/')[4];
          const { handleUpdateTracking, handleGetTrackingEvents } = await import('./admin/orders/tracking');
          if (method === 'PUT') {
            return handleCORS(await handleUpdateTracking(request, env, orderId), env, request);
          }
          if (method === 'GET') {
            return handleCORS(await handleGetTrackingEvents(request, env, orderId), env, request);
          }
        }

        if (path.match(/^\/api\/admin\/orders\/\d+\/ship$/)) {
          const orderId = path.split('/')[4];
          const { handleMarkAsShipped } = await import('./admin/orders/tracking');
          if (method === 'POST') {
            return handleCORS(await handleMarkAsShipped(request, env, orderId), env, request);
          }
        }

        if (path.match(/^\/api\/admin\/orders\/\d+\/deliver$/)) {
          const orderId = path.split('/')[4];
          const { handleMarkAsDelivered } = await import('./admin/orders/tracking');
          if (method === 'POST') {
            return handleCORS(await handleMarkAsDelivered(request, env, orderId), env, request);
          }
        }

        if (path.match(/^\/api\/admin\/orders\/\d+\/tracking-event$/)) {
          const orderId = path.split('/')[4];
          const { handleAddTrackingEvent } = await import('./admin/orders/tracking');
          if (method === 'POST') {
            return handleCORS(await handleAddTrackingEvent(request, env, orderId), env, request);
          }
        }

        // Admin favorites routes
        if (path.startsWith('/api/admin/favorites')) {
          const { handleAdminFavoritesRoutes } = await import('./admin/favorites');
          return handleCORS(await handleAdminFavoritesRoutes(request, env), env, request);
        }

        // Favorites routes (customer)
        if (path.startsWith('/api/favorites')) {
          return handleCORS(await handleFavoritesRoutes(request, env), env, request);
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
    return handleCORS(errorResponse(message, status, details), env, request);
  }
}


async function handleFavoritesRoutes(request: Request, env: Env): Promise<Response> {
  const { handleFavoritesRoutes } = await import('./favorites');
  return handleFavoritesRoutes(request, env);
}
