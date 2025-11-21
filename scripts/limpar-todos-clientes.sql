-- Script para limpar TODOS os clientes de teste do sistema
-- ATENÇÃO: Este script deleta TODOS os customers e suas relações
-- Use apenas se tiver certeza de que quer zerar o sistema

-- 1. Deletar todas as sessões de clientes
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM customers);
DELETE FROM sessions WHERE customer_id IN (SELECT id FROM customers);

-- 2. Deletar todos os favoritos
DELETE FROM favorites;

-- 3. Deletar todos os itens do carrinho
DELETE FROM cart_items;

-- 4. Deletar todos os endereços
DELETE FROM addresses;

-- 5. Deletar notificações de clientes
DELETE FROM customer_notifications;

-- 6. Deletar tickets de suporte
DELETE FROM support_tickets;

-- 7. Deletar itens de pedidos
DELETE FROM order_items;

-- 8. Deletar pedidos
DELETE FROM orders;

-- 9. Deletar uso de cupons
DELETE FROM coupon_usage;

-- 10. Deletar todos os clientes
DELETE FROM customers;

