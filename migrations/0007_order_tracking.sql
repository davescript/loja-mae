-- Migration: Sistema completo de rastreamento de pedidos
-- Adiciona campos de rastreio e transportadora

-- Adicionar campos de tracking na tabela orders
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN carrier TEXT;
ALTER TABLE orders ADD COLUMN shipped_at TEXT;
ALTER TABLE orders ADD COLUMN delivered_at TEXT;
ALTER TABLE orders ADD COLUMN estimated_delivery TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_carrier ON orders(carrier);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);

-- Tabela de eventos de tracking (histórico completo)
CREATE TABLE IF NOT EXISTS order_tracking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('created', 'paid', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned')),
  location TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_order_id ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON order_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON order_tracking_events(created_at);

