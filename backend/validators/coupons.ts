import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().int().min(1, 'Value must be positive'),
  min_purchase_cents: z.number().int().min(0).default(0),
  max_discount_cents: z.number().int().min(0).optional().nullable(),
  usage_limit: z.number().int().min(1).optional().nullable(),
  customer_limit: z.number().int().min(1).default(1),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.number().int().min(0).max(1).default(1),
});

export const updateCouponSchema = createCouponSchema.partial().omit({ code: true });

export const listCouponsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
  search: z.string().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  total_cents: z.number().int().min(0),
});

