import { z } from 'zod';

export const createOrderSchema = z.object({
  customer_id: z.number().int().positive().optional().nullable(),
  email: z.string().email('Invalid email address'),
  items: z.array(
    z.object({
      product_id: z.number().int().positive(),
      variant_id: z.number().int().positive().optional().nullable(),
      quantity: z.number().int().min(1),
    })
  ).min(1, 'At least one item is required'),
  shipping_address: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    company: z.string().optional().nullable(),
    address_line1: z.string().min(1),
    address_line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(2).max(2).default('BR'),
    phone: z.string().optional().nullable(),
  }),
  billing_address: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    company: z.string().optional().nullable(),
    address_line1: z.string().min(1),
    address_line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(2).max(2).default('BR'),
    phone: z.string().optional().nullable(),
  }).optional(),
  coupon_code: z.string().optional().nullable(),
});

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  fulfillment_status: z.enum(['unfulfilled', 'fulfilled', 'partial', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'total_cents', 'order_number']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

