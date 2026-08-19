import { errorResponse } from './response';

const STRIPE_KEY_PATTERN = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_*]+/g;
const STRIPE_ERROR_CODES = new Set([
  'api_key_expired',
  'invalid_api_key',
  'amount_too_small',
  'parameter_invalid_empty',
  'parameter_invalid_integer',
  'payment_intent_unexpected_state',
]);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || '');
  }
  return String(error || '');
}

export function sanitizeStripeErrorMessage(message: string): string {
  return message.replace(STRIPE_KEY_PATTERN, '[redacted_stripe_key]');
}

export function isStripeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeStripe = error as { type?: unknown; code?: unknown; raw?: unknown };
  const message = getErrorMessage(error);

  return (
    (typeof maybeStripe.type === 'string' && maybeStripe.type.startsWith('Stripe')) ||
    (typeof maybeStripe.code === 'string' && STRIPE_ERROR_CODES.has(maybeStripe.code)) ||
    typeof maybeStripe.raw === 'object' ||
    /stripe|api key|payment intent/i.test(message)
  );
}

export function isStripeConfigurationError(error: unknown): boolean {
  const maybeStripe = error as { type?: unknown; code?: unknown };
  const message = getErrorMessage(error);

  return (
    maybeStripe.type === 'StripeAuthenticationError' ||
    maybeStripe.code === 'api_key_expired' ||
    maybeStripe.code === 'invalid_api_key' ||
    /expired api key|invalid api key|api key provided|stripe_secret_key/i.test(message)
  );
}

export function logStripeError(context: string, error: unknown): void {
  const message = sanitizeStripeErrorMessage(getErrorMessage(error));
  const maybeStripe = error as { type?: unknown; code?: unknown; statusCode?: unknown };

  console.error(`[STRIPE] ${context}`, {
    type: maybeStripe?.type,
    code: maybeStripe?.code,
    statusCode: maybeStripe?.statusCode,
    message,
  });
}

export function stripeErrorResponse(error: unknown): Response {
  if (isStripeConfigurationError(error)) {
    return errorResponse(
      'Pagamento temporariamente indisponível. A configuração da Stripe precisa ser atualizada.',
      503,
      { code: 'PAYMENT_PROVIDER_CONFIGURATION_ERROR' }
    );
  }

  return errorResponse(
    'Não foi possível iniciar o pagamento. Tente novamente em alguns minutos.',
    502,
    { code: 'PAYMENT_PROVIDER_ERROR' }
  );
}
