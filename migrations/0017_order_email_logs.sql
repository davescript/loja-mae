-- Migration: Logs de emails de pedidos
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS order_email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK(email_type IN ('confirmation', 'shipped', 'delivered', 'cancelled')),
  status TEXT NOT NULL CHECK(status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_email_logs_order_id ON order_email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_email_logs_status ON order_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_order_email_logs_email_type ON order_email_logs(email_type);

