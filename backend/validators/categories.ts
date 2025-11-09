import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  parent_id: z.number().int().positive().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.number().int().min(0).max(1).default(1),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesSchema = z.object({
  parent_id: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
});

