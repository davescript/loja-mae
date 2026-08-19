export type SupplierCode = 'cj';

export type SupplierStatus =
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type Supplier = {
  id: string;
  code: SupplierCode;
  name: string;
  is_active: number;
  config_json: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierProduct = {
  id: string;
  product_id: number;
  supplier_id: string;
  supplier_product_id: string;
  supplier_product_sku: string | null;
  source_country_code: string | null;
  delivery_min_days: number | null;
  delivery_max_days: number | null;
  raw_json: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierVariantMapping = {
  id: string;
  variant_id: number;
  product_id: number;
  supplier_id: string;
  supplier_product_id: string;
  supplier_variant_id: string | null;
  supplier_sku: string;
  cost_cents: number;
  shipping_cost_cents: number;
  currency: string;
  stock_quantity: number;
  source_country_code: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  last_synced_at: string | null;
  raw_json: string | null;
  created_at: string;
  updated_at: string;
};

export type Fulfillment = {
  id: string;
  order_id: number;
  supplier_id: string;
  status: SupplierStatus;
  supplier_order_id: string | null;
  supplier_order_number: string | null;
  error_code: string | null;
  error_message: string | null;
  raw_request_json: string | null;
  raw_response_json: string | null;
  submitted_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FulfillmentItem = {
  id: string;
  fulfillment_id: string;
  order_item_id: number;
  supplier_variant_mapping_id: string | null;
  supplier_sku: string;
  supplier_variant_id: string | null;
  quantity: number;
  status: SupplierStatus;
  tracking_number: string | null;
  carrier: string | null;
  last_tracking_status: string | null;
  created_at: string;
  updated_at: string;
};

export type CJAdminStatus = {
  configured: boolean;
  hasApiKey: boolean;
  hasPlatformToken: boolean;
  baseUrl: string;
  defaultWarehouseCountry: string | null;
  tokenCached: boolean;
  tokenExpiresAt: string | null;
  supplierActive: boolean;
  verified?: boolean;
  verifyError?: string | null;
};

export type CJImportResult = {
  productId: number;
  imported: boolean;
  title: string;
  variantsCreated: number;
  imagesCreated: number;
};
