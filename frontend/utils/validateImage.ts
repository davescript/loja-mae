/**
 * Valida arquivo de imagem antes do upload
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
}

export function validateImage(file: File): ImageValidationResult {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

  // Validar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.',
    }
  }

  // Validar extensão
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Extensão de arquivo não permitida.',
    }
  }

  // Validar tamanho
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
    }
  }

  // Validar se é realmente uma imagem (verificar dimensões)
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      
      // Validar dimensões mínimas
      if (img.width < 10 || img.height < 10) {
        resolve({
          valid: false,
          error: 'Imagem muito pequena. Dimensões mínimas: 10x10px',
        })
        return
      }

      // Validar dimensões máximas (opcional)
      const maxDimension = 10000
      if (img.width > maxDimension || img.height > maxDimension) {
        resolve({
          valid: false,
          error: `Imagem muito grande. Dimensões máximas: ${maxDimension}x${maxDimension}px`,
        })
        return
      }

      resolve({ valid: true })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        valid: false,
        error: 'Arquivo não é uma imagem válida',
      })
    }

    img.src = objectUrl
  }) as Promise<ImageValidationResult>
}

/**
 * Valida múltiplas imagens
 */
export async function validateImages(files: File[]): Promise<ImageValidationResult> {
  if (files.length === 0) {
    return { valid: false, error: 'Nenhuma imagem selecionada' }
  }

  if (files.length > 10) {
    return { valid: false, error: 'Máximo de 10 imagens por vez' }
  }

  for (const file of files) {
    const result = await validateImage(file)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}

