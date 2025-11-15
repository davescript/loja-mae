-- Migration: Segmentação de clientes (VIP, regular, novo)

-- Adicionar campos de segmentação
ALTER TABLE customers ADD COLUMN segment TEXT DEFAULT 'new' CHECK(segment IN ('new', 'regular', 'vip', 'inactive'));
ALTER TABLE customers ADD COLUMN lifetime_value_cents INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN last_order_at TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_lifetime_value ON customers(lifetime_value_cents);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_at ON customers(last_order_at);

-- View para calcular segmentos automaticamente (executar via trigger ou cron)
-- VIP: > 10 pedidos OU > €500 lifetime value
-- Regular: 2-10 pedidos OU €50-500 lifetime value
-- New: < 2 pedidos E < €50
-- Inactive: último pedido há mais de 180 dias

