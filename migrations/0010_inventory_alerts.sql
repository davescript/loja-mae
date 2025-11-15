-- Migration: Sistema de alertas de estoque

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  alert_type TEXT NOT NULL CHECK(alert_type IN ('low_stock', 'out_of_stock', 'restocked')),
  threshold_quantity INTEGER,
  current_quantity INTEGER,
  is_resolved INTEGER DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created_at ON inventory_alerts(created_at);

-- Configurações de alerta por produto
CREATE TABLE IF NOT EXISTS inventory_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  low_stock_threshold INTEGER DEFAULT 10,
  reorder_point INTEGER DEFAULT 5,
  reorder_quantity INTEGER DEFAULT 50,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE(product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_thresholds_product_id ON inventory_thresholds(product_id);

