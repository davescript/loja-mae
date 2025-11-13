-- Script para verificar dados reais no banco

-- Ver clientes reais
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  created_at 
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver pedidos reais
SELECT 
  id, 
  order_number, 
  customer_id, 
  email, 
  status, 
  payment_status, 
  total_cents, 
  created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver produtos reais
SELECT 
  id, 
  title, 
  slug, 
  price_cents, 
  stock_quantity, 
  status,
  created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 10;

-- Contar totais
SELECT 
  (SELECT COUNT(*) FROM customers) as total_clientes,
  (SELECT COUNT(*) FROM orders) as total_pedidos,
  (SELECT COUNT(*) FROM products) as total_produtos,
  (SELECT COUNT(*) FROM order_items) as total_itens_pedidos;

