// Shared constants

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const FULFILLMENT_STATUS = {
  UNFULFILLED: 'unfulfilled',
  FULFILLED: 'fulfilled',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled',
} as const;

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const COUPON_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;

export const CURRENCY = 'BRL';

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

