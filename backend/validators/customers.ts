import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateCustomerSchema = z.object({
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
});

export const createAddressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).default('shipping'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company: z.string().optional().nullable(),
  address_line1: z.string().min(1, 'Address line 1 is required'),
  address_line2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(2).max(2).default('BR'),
  phone: z.string().optional().nullable(),
  is_default: z.number().int().min(0).max(1).default(0),
});

export const updateAddressSchema = createAddressSchema.partial();

export const listCustomersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
});

