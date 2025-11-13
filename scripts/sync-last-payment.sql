-- Script para sincronizar manualmente o último pedido pendente
-- Execute este script se o webhook não atualizou o status

-- Primeiro, vamos ver quais pedidos estão pendentes mas têm payment_intent_id
SELECT 
  id,
  order_number,
  stripe_payment_intent_id,
  payment_status,
  status,
  total_cents,
  created_at
FROM orders
WHERE payment_status = 'pending' 
  AND stripe_payment_intent_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Para atualizar manualmente um pedido específico (substitua ORDER_ID pelo ID do pedido):
-- UPDATE orders 
-- SET payment_status = 'paid', 
--     status = 'paid',
--     updated_at = datetime('now')
-- WHERE id = ORDER_ID;

