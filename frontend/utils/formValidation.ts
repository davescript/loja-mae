import { z } from 'zod';

// Schemas de validação reutilizáveis
export const emailSchema = z.string().email('Email inválido');
export const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
export const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo');
export const phoneSchema = z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Telefone inválido').optional();

// Validação de produto
export const productSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  price_cents: z.number().min(0, 'Preço deve ser positivo'),
  stock_quantity: z.number().int().min(0, 'Estoque não pode ser negativo'),
  sku: z.string().optional(),
});

// Validação de categoria
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  slug: z.string().optional(),
  description: z.string().optional(),
});

// Validação de endereço
export const addressSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  address_line1: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Distrito é obrigatório'),
  postal_code: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal inválido (formato: 1234-567)'),
  country: z.string().length(2, 'Código do país inválido'),
  phone: phoneSchema,
});

// Helper para validar formulário
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Helper para formatar erros de validação
export function formatValidationErrors(errors: z.ZodError): string {
  return errors.errors.map(e => e.message).join(', ');
}

