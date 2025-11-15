// Shared types between frontend and backend

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Product types
export type Product = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  sku: string | null;
  barcode: string | null;
  stock_quantity: number;
  track_inventory: number;
  weight_grams: number | null;
  status: 'draft' | 'active' | 'archived';
  featured: number;
  category_id: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Category;
};

export type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  image_key: string;
  alt_text: string | null;
  position: number;
  is_primary: number;
  created_at: string;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  title: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  sku: string | null;
  barcode: string | null;
  stock_quantity: number;
  track_inventory: number;
  weight_grams: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

// Category types
export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  image_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
  parent?: Category;
};

// Customer types
export type Customer = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  is_active: number;
  email_verified: number;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: number;
  customer_id: number;
  type: 'shipping' | 'billing' | 'both';
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: number;
  created_at: string;
  updated_at: string;
};

// Order types
export type Order = {
  id: number;
  order_number: string;
  customer_id: number | null;
  email: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'fulfilled' | 'partial' | 'cancelled';
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  coupon_id: number | null;
  coupon_code: string | null;
  coupon_discount_cents: number;
  shipping_address_id: number | null;
  shipping_address_json: string | null;
  billing_address_json: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer?: Customer;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  title: string;
  sku: string | null;
  quantity: number;
  price_cents: number;
  total_cents: number;
  image_url: string | null;
  created_at: string;
};

// Coupon types
export type Coupon = {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase_cents: number;
  max_discount_cents: number | null;
  usage_limit: number | null;
  usage_count: number;
  customer_limit: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

// Cart types
export type CartItem = {
  id: number;
  customer_id: number | null;
  session_id: string | null;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price_cents: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
};

// Favorite types
export type Favorite = {
  id: number;
  customer_id: number;
  product_id: number;
  created_at: string;
  product?: Product;
};

// Auth types
export type AuthUser = {
  id: number;
  email: string;
  name?: string;
  type: 'customer' | 'admin';
  role?: 'super_admin' | 'admin' | 'editor';
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

// Checkout types
export type CheckoutRequest = {
  items: {
    product_id: number;
    variant_id?: number;
    quantity: number;
  }[];
  shipping_address: Address;
  billing_address?: Address;
  coupon_code?: string;
};

export type CheckoutResponse = {
  order_id: number;
  order_number: string;
  client_secret: string;
  total_cents: number;
};

// Stripe types
export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: any;
  };
};

// Blog types
export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
