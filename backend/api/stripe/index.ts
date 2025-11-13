import type { Env } from '../../types';
import { handleCheckout } from './checkout';
import { handleWebhook } from './webhook';
import { handleCreateIntent } from './create-intent';
import { successResponse, errorResponse } from '../../utils/response';

export async function handleStripeRoutes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  // Checkout: POST /api/stripe/checkout
  if (method === 'POST' && path === '/api/stripe/checkout') {
    return handleCheckout(request, env);
  }

    // Create Payment Intent: POST /api/stripe/create-intent
    if (method === 'POST' && path === '/api/stripe/create-intent') {
      return handleCreateIntent(request, env);
    }

    // Webhook: POST /api/stripe/webhook
    if (method === 'POST' && path === '/api/stripe/webhook') {
      return handleWebhook(request, env);
    }

  // Config: GET /api/stripe/config
  if (method === 'GET' && path === '/api/stripe/config') {
    const publishableKey = env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return errorResponse('Stripe publishable key not configured', 500);
    }
    return successResponse({ publishableKey });
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
