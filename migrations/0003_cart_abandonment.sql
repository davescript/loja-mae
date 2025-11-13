-- Migration: Cart Abandonment System
-- Created: 2024-11-13
-- Description: Tabelas para sistema de recuperação de carrinho abandonado

-- Tabela: carts
-- Armazena carrinhos de compra (abertos, abandonados, recuperados)
-- Usa a estrutura existente de cart_items mas adiciona tracking de carrinho
CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  customer_id INTEGER,
  session_id TEXT,
  email TEXT,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'abandoned', 'recovered', 'completed')),
  total_cents INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_carts_updated_at ON carts(updated_at);
CREATE INDEX IF NOT EXISTS idx_carts_email ON carts(email);

-- Adicionar colunas à tabela cart_items existente se não existirem
-- (cart_items já existe na migration inicial, vamos apenas adicionar campos se necessário)
-- A tabela cart_items existente já tem: customer_id, session_id, product_id, variant_id, quantity, price_cents
-- Vamos adicionar campos para tracking de carrinho abandonado
ALTER TABLE cart_items ADD COLUMN cart_id TEXT;
ALTER TABLE cart_items ADD COLUMN product_name TEXT;
ALTER TABLE cart_items ADD COLUMN image_url TEXT;
ALTER TABLE cart_items ADD COLUMN sku TEXT;

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Tabela: cart_abandonment_log
-- Log de emails enviados para recuperação
CREATE TABLE IF NOT EXISTS cart_abandonment_log (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT 0,
  email_sent_at TEXT,
  email_address TEXT,
  recovery_link TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_abandonment_log_cart_id ON cart_abandonment_log(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_abandonment_log_email_sent ON cart_abandonment_log(email_sent);

