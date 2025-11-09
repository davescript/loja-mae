-- Seed script para popular produtos com imagens no R2

-- Limpar dados existentes (opcional)
-- DELETE FROM product_images;
-- DELETE FROM product_variants;
-- DELETE FROM products;
-- DELETE FROM categories;

-- Criar categorias
INSERT OR IGNORE INTO categories (name, slug, description, is_active) VALUES
  ('Eletrônicos', 'eletronicos', 'Smartphones, tablets, laptops e acessórios', 1),
  ('Roupas', 'roupas', 'Roupas masculinas, femininas e infantis', 1),
  ('Casa & Decoração', 'casa-decoracao', 'Móveis, decoração e itens para casa', 1),
  ('Livros', 'livros', 'Livros, eBooks e materiais educacionais', 1),
  ('Esportes', 'esportes', 'Equipamentos esportivos e fitness', 1),
  ('Beleza & Cuidados', 'beleza-cuidados', 'Produtos de beleza e cuidados pessoais', 1);

-- Criar produtos de exemplo
-- Nota: As imagens precisam ser uploadadas para o R2 primeiro
-- Use a API POST /api/products para criar produtos com imagens

-- Produto 1: Smartphone
INSERT OR IGNORE INTO products (
  title, slug, description, short_description, 
  price_cents, compare_at_price_cents, 
  stock_quantity, status, featured, category_id,
  sku, meta_title, meta_description
) VALUES (
  'Smartphone Premium XYZ',
  'smartphone-premium-xyz',
  'Smartphone de última geração com tela AMOLED de 6.7 polegadas, processador octa-core, 8GB RAM, 256GB de armazenamento, câmera tripla de 108MP, bateria de 5000mAh com carregamento rápido de 65W.',
  'Smartphone premium com câmera de 108MP',
  299900,
  349900,
  50,
  'active',
  1,
  1,
  'SM-XYZ-001',
  'Smartphone Premium XYZ - Loja Mãe',
  'Compre o Smartphone Premium XYZ com as melhores especificações. Entrega rápida e garantia.'
);

-- Produto 2: Notebook
INSERT OR IGNORE INTO products (
  title, slug, description, short_description,
  price_cents, compare_at_price_cents,
  stock_quantity, status, featured, category_id,
  sku, meta_title, meta_description
) VALUES (
  'Notebook Gamer Pro',
  'notebook-gamer-pro',
  'Notebook gamer com processador Intel i7 de 11ª geração, 16GB RAM, SSD 512GB, placa de vídeo dedicada RTX 3060, tela Full HD de 15.6 polegadas, teclado retroiluminado RGB.',
  'Notebook gamer de alto desempenho',
  599900,
  699900,
  30,
  'active',
  1,
  1,
  'NB-GAMER-001',
  'Notebook Gamer Pro - Loja Mãe',
  'Notebook gamer profissional para jogos e trabalho. Performance excepcional.'
);

-- Produto 3: Camiseta Básica
INSERT OR IGNORE INTO products (
  title, slug, description, short_description,
  price_cents, compare_at_price_cents,
  stock_quantity, status, featured, category_id,
  sku, weight_grams, meta_title, meta_description
) VALUES (
  'Camiseta Básica Algodão',
  'camiseta-basica-algodao',
  'Camiseta básica de algodão 100%, macia e confortável. Disponível em várias cores. Perfeita para o dia a dia.',
  'Camiseta básica de algodão',
  4990,
  6990,
  100,
  'active',
  1,
  2,
  'CAM-BAS-001',
  150,
  'Camiseta Básica Algodão - Loja Mãe',
  'Camiseta básica de algodão, confortável e versátil. Múltiplas cores disponíveis.'
);

-- Produto 4: Livro de Programação
INSERT OR IGNORE INTO products (
  title, slug, description, short_description,
  price_cents, compare_at_price_cents,
  stock_quantity, status, featured, category_id,
  sku, weight_grams, meta_title, meta_description
) VALUES (
  'Guia Completo de TypeScript',
  'guia-completo-typescript',
  'Livro completo sobre TypeScript, desde o básico até conceitos avançados. Inclui exemplos práticos e projetos reais.',
  'Aprenda TypeScript do zero ao avançado',
  7990,
  9990,
  25,
  'active',
  0,
  4,
  'LIV-TS-001',
  500,
  'Guia Completo de TypeScript - Loja Mãe',
  'Livro completo de TypeScript para desenvolvedores. Aprenda programação moderna.'
);

-- Produto 5: Sofá Retrátil
INSERT OR IGNORE INTO products (
  title, slug, description, short_description,
  price_cents, compare_at_price_cents,
  stock_quantity, status, featured, category_id,
  sku, weight_grams, meta_title, meta_description
) VALUES (
  'Sofá Retrátil Conforto',
  'sofa-retratil-conforto',
  'Sofá retrátil 3 lugares, estofado em tecido antimofo, estrutura em madeira maciça, almofadas de apoio incluídas. Perfeito para sua sala.',
  'Sofá retrátil confortável 3 lugares',
  129900,
  159900,
  15,
  'active',
  1,
  3,
  'SOFA-RET-001',
  45000,
  'Sofá Retrátil Conforto - Loja Mãe',
  'Sofá retrátil confortável para sua sala. Qualidade e conforto garantidos.'
);

-- Produto 6: Tênis Esportivo
INSERT OR IGNORE INTO products (
  title, slug, description, short_description,
  price_cents, compare_at_price_cents,
  stock_quantity, status, featured, category_id,
  sku, weight_grams, meta_title, meta_description
) VALUES (
  'Tênis Esportivo Pro',
  'tenis-esportivo-pro',
  'Tênis esportivo de alta performance, ideal para corrida e caminhada. Solado antiderrapante, palmilha acolchoada, respirabilidade garantida.',
  'Tênis esportivo de alta performance',
  29990,
  39990,
  80,
  'active',
  1,
  5,
  'TEN-ESP-001',
  350,
  'Tênis Esportivo Pro - Loja Mãe',
  'Tênis esportivo profissional para corrida e caminhada. Conforto e desempenho.'
);

-- Produto 7: Perfume Importado
INSERT OR IGNORE INTO products (
  title, slug, description, short_description,
  price_cents, compare_at_price_cents,
  stock_quantity, status, featured, category_id,
  sku, weight_grams, meta_title, meta_description
) VALUES (
  'Perfume Elegance 100ml',
  'perfume-elegance-100ml',
  'Perfume importado, fragrância sofisticada e duradoura. Notas amadeiradas e florais. Embalagem elegante.',
  'Perfume importado fragrância sofisticada',
  19990,
  24990,
  40,
  'active',
  0,
  6,
  'PERF-ELE-001',
  200,
  'Perfume Elegance 100ml - Loja Mãe',
  'Perfume importado de fragrância sofisticada. Elegância e qualidade.'
);

-- Nota: Para adicionar imagens aos produtos, use a API:
-- POST /api/products com FormData contendo:
-- - title, description, price_cents, etc.
-- - images: File[] (arquivos de imagem)
-- 
-- Ou use o endpoint específico após criar o produto:
-- POST /api/products/{id}/images

