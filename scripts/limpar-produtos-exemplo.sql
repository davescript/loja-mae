-- Script para limpar produtos de exemplo do banco de dados
-- Execute com: npx wrangler d1 execute loja-mae-db --remote --file=./scripts/limpar-produtos-exemplo.sql

-- Deletar imagens dos produtos de exemplo
DELETE FROM product_images 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE slug IN (
    'smartphone-premium-xyz',
    'notebook-gamer-pro',
    'camiseta-basica-algodao',
    'guia-completo-typescript',
    'sofa-retratil-conforto',
    'tenis-esportivo-pro',
    'perfume-elegance-100ml'
  )
);

-- Deletar variantes dos produtos de exemplo
DELETE FROM product_variants 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE slug IN (
    'smartphone-premium-xyz',
    'notebook-gamer-pro',
    'camiseta-basica-algodao',
    'guia-completo-typescript',
    'sofa-retratil-conforto',
    'tenis-esportivo-pro',
    'perfume-elegance-100ml'
  )
);

-- Deletar produtos de exemplo
DELETE FROM products 
WHERE slug IN (
  'smartphone-premium-xyz',
  'notebook-gamer-pro',
  'camiseta-basica-algodao',
  'guia-completo-typescript',
  'sofa-retratil-conforto',
  'tenis-esportivo-pro',
  'perfume-elegance-100ml'
);

-- Deletar categorias de exemplo (se não tiverem outros produtos)
DELETE FROM categories 
WHERE slug IN (
  'eletronicos',
  'roupas',
  'casa-decoracao',
  'livros',
  'esportes',
  'beleza-cuidados'
)
AND id NOT IN (
  SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL
);

-- Verificar produtos restantes
SELECT COUNT(*) as total_produtos FROM products;
SELECT COUNT(*) as total_categorias FROM categories;
SELECT COUNT(*) as total_imagens FROM product_images;

