-- Script para limpar dados simulados mantendo pedidos reais
-- Mantém:
-- - Pedidos com payment_status = 'paid' ou que tenham stripe_payment_intent_id
-- - Clientes que fizeram pedidos reais
-- - Produtos que estão em pedidos reais

-- 1. Identificar IDs de pedidos reais (com pagamento confirmado)
-- Estes serão mantidos

-- 2. Identificar IDs de produtos que estão em pedidos reais
-- Estes serão mantidos

-- 3. Identificar IDs de clientes que têm pedidos reais
-- Estes serão mantidos

-- 4. Deletar produtos que NÃO estão em pedidos reais
DELETE FROM product_images 
WHERE product_id IN (
  SELECT p.id 
  FROM products p
  WHERE p.id NOT IN (
    SELECT DISTINCT oi.product_id 
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM product_variants 
WHERE product_id IN (
  SELECT p.id 
  FROM products p
  WHERE p.id NOT IN (
    SELECT DISTINCT oi.product_id 
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM products 
WHERE id NOT IN (
  SELECT DISTINCT oi.product_id 
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  WHERE o.payment_status = 'paid' 
     OR o.stripe_payment_intent_id IS NOT NULL
     OR o.stripe_charge_id IS NOT NULL
);

-- 5. Deletar pedidos que NÃO são reais (sem pagamento confirmado)
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE payment_status != 'paid' 
    AND stripe_payment_intent_id IS NULL 
    AND stripe_charge_id IS NULL
);

-- Deletar histórico de tracking de pedidos não reais (se a tabela existir)
-- DELETE FROM order_tracking_history 
-- WHERE order_id IN (
--   SELECT id FROM orders 
--   WHERE payment_status != 'paid' 
--     AND stripe_payment_intent_id IS NULL 
--     AND stripe_charge_id IS NULL
-- );

DELETE FROM orders 
WHERE payment_status != 'paid' 
  AND stripe_payment_intent_id IS NULL 
  AND stripe_charge_id IS NULL;

-- 6. Deletar clientes que NÃO têm pedidos reais
DELETE FROM addresses 
WHERE customer_id IN (
  SELECT c.id 
  FROM customers c
  WHERE c.id NOT IN (
    SELECT DISTINCT o.customer_id 
    FROM orders o
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM cart_items 
WHERE customer_id IN (
  SELECT c.id 
  FROM customers c
  WHERE c.id NOT IN (
    SELECT DISTINCT o.customer_id 
    FROM orders o
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM favorites 
WHERE customer_id IN (
  SELECT c.id 
  FROM customers c
  WHERE c.id NOT IN (
    SELECT DISTINCT o.customer_id 
    FROM orders o
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM customer_notifications 
WHERE customer_id IN (
  SELECT c.id 
  FROM customers c
  WHERE c.id NOT IN (
    SELECT DISTINCT o.customer_id 
    FROM orders o
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM support_tickets 
WHERE customer_id IN (
  SELECT c.id 
  FROM customers c
  WHERE c.id NOT IN (
    SELECT DISTINCT o.customer_id 
    FROM orders o
    WHERE o.payment_status = 'paid' 
       OR o.stripe_payment_intent_id IS NOT NULL
       OR o.stripe_charge_id IS NOT NULL
  )
);

DELETE FROM customers 
WHERE id NOT IN (
  SELECT DISTINCT o.customer_id 
  FROM orders o
  WHERE o.payment_status = 'paid' 
     OR o.stripe_payment_intent_id IS NOT NULL
     OR o.stripe_charge_id IS NOT NULL
);

-- 7. Deletar categorias que não têm produtos
DELETE FROM categories 
WHERE id NOT IN (
  SELECT DISTINCT category_id 
  FROM products 
  WHERE category_id IS NOT NULL
);

-- 8. Deletar cupons não utilizados em pedidos reais
DELETE FROM coupon_usage 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE payment_status != 'paid' 
    AND stripe_payment_intent_id IS NULL 
    AND stripe_charge_id IS NULL
);

DELETE FROM coupons 
WHERE id NOT IN (
  SELECT DISTINCT cu.coupon_id 
  FROM coupon_usage cu
  INNER JOIN orders o ON cu.order_id = o.id
  WHERE o.payment_status = 'paid' 
     OR o.stripe_payment_intent_id IS NOT NULL
     OR o.stripe_charge_id IS NOT NULL
);

-- 9. Estatísticas finais
SELECT 
  (SELECT COUNT(*) FROM customers) as total_clientes,
  (SELECT COUNT(*) FROM orders) as total_pedidos,
  (SELECT COUNT(*) FROM products) as total_produtos,
  (SELECT COUNT(*) FROM categories) as total_categorias,
  (SELECT COUNT(*) FROM order_items) as total_itens_pedidos;

