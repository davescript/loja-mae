import type { Env } from '../../types';
import { handleCheckout } from './checkout';
import { handleWebhook } from './webhook';

export async function handleStripeRoutes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  // Checkout: POST /api/stripe/checkout
  if (method === 'POST' && path === '/api/stripe/checkout') {
    return handleCheckout(request, env);
  }

  // Webhook: POST /api/stripe/webhook
  if (method === 'POST' && path === '/api/stripe/webhook') {
    return handleWebhook(request, env);
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

