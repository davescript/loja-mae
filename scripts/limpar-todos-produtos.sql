-- Script para limpar TODOS os produtos do sistema
-- ATENÇÃO: Este script deleta TODOS os produtos e suas relações
-- Use apenas se tiver certeza de que quer zerar os produtos

-- 1. Deletar todas as imagens de produtos do banco
DELETE FROM product_images;

-- 2. Deletar todas as variantes de produtos
DELETE FROM product_variants;

-- 3. Deletar produtos de coleções (se tabela existir)
-- DELETE FROM collection_products;

-- 4. Deletar todos os favoritos (já que não há mais produtos)
DELETE FROM favorites;

-- 5. Deletar todos os itens do carrinho (já que não há mais produtos)
DELETE FROM cart_items;

-- 6. Deletar todos os produtos
DELETE FROM products;

-- 7. Deletar categorias que não têm produtos (opcional - comente se quiser manter categorias)
-- DELETE FROM categories WHERE id NOT IN (SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL);

-- Estatísticas finais
SELECT 
  (SELECT COUNT(*) FROM products) as total_produtos,
  (SELECT COUNT(*) FROM product_images) as total_imagens,
  (SELECT COUNT(*) FROM product_variants) as total_variantes,
  (SELECT COUNT(*) FROM favorites) as total_favoritos,
  (SELECT COUNT(*) FROM cart_items) as total_carrinho,
  (SELECT COUNT(*) FROM categories) as total_categorias;

