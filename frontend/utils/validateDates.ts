/**
 * Valida se data de início é anterior à data de término
 */
export function validateDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: true } // Datas opcionais são válidas
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Data de início inválida' }
  }

  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Data de término inválida' }
  }

  if (start >= end) {
    return { valid: false, error: 'Data de início deve ser anterior à data de término' }
  }

  return { valid: true }
}

/**
 * Valida se data não está no passado
 */
export function validateFutureDate(date: string | null | undefined): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: true }
  }

  const dateObj = new Date(date)
  const now = new Date()

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Data inválida' }
  }

  if (dateObj < now) {
    return { valid: false, error: 'Data não pode ser no passado' }
  }

  return { valid: true }
}

/**
 * Valida se data não está muito no futuro (ex: 10 anos)
 */
export function validateReasonableDate(date: string | null | undefined): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: true }
  }

  const dateObj = new Date(date)
  const maxFuture = new Date()
  maxFuture.setFullYear(maxFuture.getFullYear() + 10)

  if (dateObj > maxFuture) {
    return { valid: false, error: 'Data muito no futuro (máximo 10 anos)' }
  }

  return { valid: true }
}

