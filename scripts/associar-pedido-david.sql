-- Script para associar pedido ORD-MHX91ITI-7FGF08 ao cliente David Sousa
-- Email: davetrader007@gmail.com

-- Associar pedido ao cliente
UPDATE orders 
SET 
  customer_id = (SELECT id FROM customers WHERE email = 'davetrader007@gmail.com'),
  email = 'davetrader007@gmail.com',
  updated_at = datetime('now')
WHERE order_number = 'ORD-MHX91ITI-7FGF08';

-- Verificar resultado
SELECT 
  o.id,
  o.order_number,
  o.customer_id,
  o.email,
  o.status,
  o.payment_status,
  o.total_cents,
  c.email as customer_email,
  c.first_name,
  c.last_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.order_number = 'ORD-MHX91ITI-7FGF08';

