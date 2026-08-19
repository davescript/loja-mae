-- Migration: CJ Dropshipping foundation
-- Adds supplier mapping, fulfillment state, and API logging for CJ integration.

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  config_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO suppliers (id, code, name, is_active)
VALUES ('cj', 'cj', 'CJ Dropshipping', 1);

CREATE TABLE IF NOT EXISTS supplier_auth_tokens (
  supplier_code TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  access_token_expires_at TEXT NOT NULL,
  refresh_token TEXT,
  refresh_token_expires_at TEXT,
  open_id TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_code) REFERENCES suppliers(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supplier_products (
  id TEXT PRIMARY KEY,
  product_id INTEGER NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_product_id TEXT NOT NULL,
  supplier_product_sku TEXT,
  source_country_code TEXT,
  delivery_min_days INTEGER,
  delivery_max_days INTEGER,
  raw_json TEXT,
  last_synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE(supplier_id, supplier_product_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_product_id ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_product_id ON supplier_products(supplier_product_id);

CREATE TABLE IF NOT EXISTS supplier_variant_mappings (
  id TEXT PRIMARY KEY,
  variant_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_product_id TEXT NOT NULL,
  supplier_variant_id TEXT,
  supplier_sku TEXT NOT NULL,
  cost_cents INTEGER DEFAULT 0,
  shipping_cost_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stock_quantity INTEGER DEFAULT 0,
  source_country_code TEXT,
  warehouse_id TEXT,
  warehouse_name TEXT,
  last_synced_at TEXT,
  raw_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE(supplier_id, supplier_sku),
  UNIQUE(supplier_id, supplier_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_variant_mappings_variant_id ON supplier_variant_mappings(variant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_variant_mappings_product_id ON supplier_variant_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_variant_mappings_supplier_id ON supplier_variant_mappings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_variant_mappings_supplier_sku ON supplier_variant_mappings(supplier_sku);
CREATE INDEX IF NOT EXISTS idx_supplier_variant_mappings_last_synced_at ON supplier_variant_mappings(last_synced_at);

CREATE TABLE IF NOT EXISTS fulfillments (
  id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'accepted', 'paid', 'shipped', 'delivered', 'failed', 'cancelled')),
  supplier_order_id TEXT,
  supplier_order_number TEXT,
  error_code TEXT,
  error_message TEXT,
  raw_request_json TEXT,
  raw_response_json TEXT,
  submitted_at TEXT,
  shipped_at TEXT,
  delivered_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fulfillments_order_id ON fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_supplier_id ON fulfillments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON fulfillments(status);
CREATE INDEX IF NOT EXISTS idx_fulfillments_supplier_order_id ON fulfillments(supplier_order_id);

CREATE TABLE IF NOT EXISTS fulfillment_items (
  id TEXT PRIMARY KEY,
  fulfillment_id TEXT NOT NULL,
  order_item_id INTEGER NOT NULL,
  supplier_variant_mapping_id TEXT,
  supplier_sku TEXT NOT NULL,
  supplier_variant_id TEXT,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'accepted', 'shipped', 'delivered', 'failed', 'cancelled')),
  tracking_number TEXT,
  carrier TEXT,
  last_tracking_status TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (fulfillment_id) REFERENCES fulfillments(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_variant_mapping_id) REFERENCES supplier_variant_mappings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_items_fulfillment_id ON fulfillment_items(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_order_item_id ON fulfillment_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_supplier_sku ON fulfillment_items(supplier_sku);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_status ON fulfillment_items(status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_tracking_number ON fulfillment_items(tracking_number);

CREATE TABLE IF NOT EXISTS supplier_api_logs (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  request_id TEXT,
  success INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_supplier_api_logs_supplier_id ON supplier_api_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_api_logs_created_at ON supplier_api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_api_logs_success ON supplier_api_logs(success);

ALTER TABLE products ADD COLUMN supplier_type TEXT DEFAULT 'manual';
ALTER TABLE products ADD COLUMN cj_product_id TEXT;
ALTER TABLE products ADD COLUMN cj_product_sku TEXT;
ALTER TABLE products ADD COLUMN supplier_source_country_code TEXT;
ALTER TABLE products ADD COLUMN supplier_delivery_min_days INTEGER;
ALTER TABLE products ADD COLUMN supplier_delivery_max_days INTEGER;
ALTER TABLE products ADD COLUMN supplier_last_synced_at TEXT;

CREATE INDEX IF NOT EXISTS idx_products_supplier_type ON products(supplier_type);
CREATE INDEX IF NOT EXISTS idx_products_cj_product_id ON products(cj_product_id);

ALTER TABLE product_variants ADD COLUMN cj_variant_id TEXT;
ALTER TABLE product_variants ADD COLUMN cj_sku TEXT;
ALTER TABLE product_variants ADD COLUMN supplier_cost_cents INTEGER DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN supplier_shipping_cost_cents INTEGER DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN supplier_currency TEXT DEFAULT 'USD';
ALTER TABLE product_variants ADD COLUMN supplier_source_country_code TEXT;
ALTER TABLE product_variants ADD COLUMN supplier_warehouse_id TEXT;
ALTER TABLE product_variants ADD COLUMN supplier_warehouse_name TEXT;
ALTER TABLE product_variants ADD COLUMN supplier_last_synced_at TEXT;

CREATE INDEX IF NOT EXISTS idx_product_variants_cj_variant_id ON product_variants(cj_variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_cj_sku ON product_variants(cj_sku);

ALTER TABLE orders ADD COLUMN dropshipping_status TEXT DEFAULT 'not_required';
ALTER TABLE orders ADD COLUMN dropshipping_error TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_dropshipping_status ON orders(dropshipping_status);

ALTER TABLE order_items ADD COLUMN supplier TEXT DEFAULT 'manual';
ALTER TABLE order_items ADD COLUMN cj_order_id TEXT;
ALTER TABLE order_items ADD COLUMN cj_variant_id TEXT;
ALTER TABLE order_items ADD COLUMN cj_sku TEXT;
ALTER TABLE order_items ADD COLUMN fulfillment_item_status TEXT DEFAULT 'not_required';

CREATE INDEX IF NOT EXISTS idx_order_items_supplier ON order_items(supplier);
CREATE INDEX IF NOT EXISTS idx_order_items_cj_order_id ON order_items(cj_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_cj_sku ON order_items(cj_sku);
