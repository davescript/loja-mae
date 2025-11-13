-- Script para associar pedido a um cliente específico
-- Use este script se você quiser associar o pedido ORD-MHX91ITI-7FGF08 a um cliente

-- IMPORTANTE: Substitua 'SEU_EMAIL@example.com' pelo email que você usou no checkout
-- ou pelo email da sua conta

-- Exemplo: Se você fez login com teste@example.com, use:
-- UPDATE orders SET customer_id = (SELECT id FROM customers WHERE email = 'teste@example.com'), email = 'teste@example.com' WHERE order_number = 'ORD-MHX91ITI-7FGF08';

-- Para verificar qual email você usou no checkout, veja o campo 'email' na tabela orders:
SELECT id, order_number, customer_id, email, status, payment_status, total_cents, created_at 
FROM orders 
WHERE order_number = 'ORD-MHX91ITI-7FGF08';

-- Para associar manualmente (substitua o email):
-- UPDATE orders 
-- SET customer_id = (SELECT id FROM customers WHERE email = 'SEU_EMAIL@example.com'),
--     email = 'SEU_EMAIL@example.com'
-- WHERE order_number = 'ORD-MHX91ITI-7FGF08';

