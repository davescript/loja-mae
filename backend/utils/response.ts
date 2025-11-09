import type { ApiResponse } from '@shared/types';

export function successResponse<T>(data: T, message?: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
): Response {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { data: details }),
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function notFoundResponse(message: string = 'Resource not found'): Response {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden'): Response {
  return errorResponse(message, 403);
}

export function serverErrorResponse(
  message: string = 'Internal server error',
  details?: any
): Response {
  return errorResponse(message, 500, details);
}

export function validationErrorResponse(
  errors: Record<string, string[]>
): Response {
  return errorResponse('Validation error', 400, { errors });
}

