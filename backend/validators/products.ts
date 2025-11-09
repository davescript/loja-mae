import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  price_cents: z.number().int().min(0, 'Price must be positive'),
  compare_at_price_cents: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.number().int().min(0).max(1).default(1),
  weight_grams: z.number().int().min(0).optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  featured: z.number().int().min(0).max(1).default(0),
  category_id: z.number().int().positive().optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  featured: z.coerce.number().int().min(0).max(1).optional(),
  sortBy: z.enum(['title', 'price_cents', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createProductVariantSchema = z.object({
  product_id: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  price_cents: z.number().int().min(0),
  compare_at_price_cents: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.number().int().min(0).max(1).default(1),
  weight_grams: z.number().int().min(0).optional().nullable(),
  option1: z.string().max(100).optional().nullable(),
  option2: z.string().max(100).optional().nullable(),
  option3: z.string().max(100).optional().nullable(),
  position: z.number().int().min(0).default(0),
});

export const updateProductVariantSchema = createProductVariantSchema.partial().omit({ product_id: true });

