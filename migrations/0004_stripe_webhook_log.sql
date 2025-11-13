-- Migration: Add Stripe webhook log table for idempotency
-- This table prevents duplicate processing of webhook events

CREATE TABLE IF NOT EXISTS stripe_webhook_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payment_intent_id TEXT,
  order_id INTEGER,
  processed BOOLEAN DEFAULT 0,
  payload TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_log_event_id ON stripe_webhook_log(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_log_payment_intent_id ON stripe_webhook_log(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_log_order_id ON stripe_webhook_log(order_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_log_processed ON stripe_webhook_log(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_log_created_at ON stripe_webhook_log(created_at);

