/**
 * Centralized error handling for the application
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Erro de conexão') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Não autenticado') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Sem permissão') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Handle and format errors for user display
 */
export function handleError(error: unknown): { message: string; type: string; details?: any } {
  if (error instanceof NetworkError) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      type: 'network',
    }
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message || 'Dados inválidos. Verifique os campos do formulário.',
      type: 'validation',
      details: error.fields,
    }
  }

  if (error instanceof AuthenticationError) {
    return {
      message: 'Sua sessão expirou. Por favor, faça login novamente.',
      type: 'authentication',
    }
  }

  if (error instanceof AuthorizationError) {
    return {
      message: 'Você não tem permissão para realizar esta ação.',
      type: 'authorization',
    }
  }

  if (error instanceof ApiError) {
    return {
      message: error.message || 'Erro ao processar solicitação.',
      type: 'api',
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'Erro inesperado. Tente novamente.',
      type: 'unknown',
    }
  }

  return {
    message: 'Erro inesperado. Tente novamente.',
    type: 'unknown',
  }
}

