-- Script para atualizar pedido pago com Revolut
-- Pedido: ORD-MHX91ITI-7FGF08
-- Payment Intent: pi_3SSxBVLHRh8zOCQC0CBtQ8po

-- 1. Atualizar status do pedido para pago
UPDATE orders 
SET 
  payment_status = 'paid',
  status = 'paid',
  updated_at = datetime('now')
WHERE order_number = 'ORD-MHX91ITI-7FGF08';

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
  'Pagamento confirmado via Stripe (Revolut) - €1,00',
  datetime('now')
FROM orders 
WHERE order_number = 'ORD-MHX91ITI-7FGF08';

-- 3. Verificar resultado
SELECT 
  id,
  order_number,
  status,
  payment_status,
  fulfillment_status,
  total_cents,
  stripe_payment_intent_id,
  stripe_charge_id,
  created_at
FROM orders 
WHERE order_number = 'ORD-MHX91ITI-7FGF08';

