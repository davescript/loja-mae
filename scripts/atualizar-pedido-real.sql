-- Script para atualizar pedido real com pagamento confirmado
-- Pedido: ORD-MHXAZ03J-8D4JHG
-- Payment Intent: pi_3SSy1nLHRh8zOCQC0Hndom3h

-- 1. Atualizar status do pedido para pago
UPDATE orders 
SET 
  payment_status = 'paid',
  status = 'paid',
  updated_at = datetime('now')
WHERE order_number = 'ORD-MHXAZ03J-8D4JHG';

-- 2. Adicionar histórico de tracking inicial
INSERT INTO order_status_history (
  order_id, 
  status, 
  payment_status, 
  fulfillment_status,
  notes,
  created_at
)
SELECT 
  id,
  'paid',
  'paid',
  'unfulfilled',
  'Pagamento confirmado via Stripe (Revolut)',
  datetime('now')
FROM orders 
WHERE order_number = 'ORD-MHXAZ03J-8D4JHG';

-- 3. Adicionar histórico de preparação (simulado - pode ser atualizado depois)
INSERT INTO order_status_history (
  order_id, 
  status, 
  payment_status, 
  fulfillment_status,
  notes,
  created_at
)
SELECT 
  id,
  'processing',
  'paid',
  'processing',
  'Pedido em preparação',
  datetime('now', '+1 hour')
FROM orders 
WHERE order_number = 'ORD-MHXAZ03J-8D4JHG';

-- 4. Verificar resultado
SELECT 
  id,
  order_number,
  status,
  payment_status,
  fulfillment_status,
  total_cents,
  stripe_payment_intent_id,
  created_at
FROM orders 
WHERE order_number = 'ORD-MHXAZ03J-8D4JHG';

SELECT 
  id,
  order_id,
  status,
  payment_status,
  fulfillment_status,
  notes,
  created_at
FROM order_status_history 
WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD-MHXAZ03J-8D4JHG')
ORDER BY created_at ASC;

