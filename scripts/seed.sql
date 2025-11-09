-- Seed script for initial data

-- Create admin user (password: admin123)
INSERT OR IGNORE INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '$2a$10$rOzJqZrZrJqZrJqZrJqZrOuJqZrJqZrJqZrJqZrJqZrJqZrJqZrJq', -- bcrypt hash of 'admin123'
  'Admin',
  'super_admin',
  1
);

-- Create sample categories
INSERT OR IGNORE INTO categories (name, slug, description, is_active)
VALUES
  ('Eletrônicos', 'eletronicos', 'Produtos eletrônicos', 1),
  ('Roupas', 'roupas', 'Roupas e acessórios', 1),
  ('Casa', 'casa', 'Produtos para casa', 1),
  ('Livros', 'livros', 'Livros e literatura', 1);

-- Create sample products
INSERT OR IGNORE INTO products (title, slug, description, short_description, price_cents, stock_quantity, status, featured, category_id)
VALUES
  (
    'Smartphone XYZ',
    'smartphone-xyz',
    'Um smartphone incrível com todas as funcionalidades modernas',
    'Smartphone de última geração',
    299900,
    50,
    'active',
    1,
    1
  ),
  (
    'Camiseta Básica',
    'camiseta-basica',
    'Camiseta básica de algodão, confortável e versátil',
    'Camiseta básica de algodão',
    4990,
    100,
    'active',
    1,
    2
  ),
  (
    'Livro de Programação',
    'livro-programacao',
    'Aprenda programação do zero com este livro completo',
    'Livro completo de programação',
    7990,
    30,
    'active',
    0,
    4
  );

-- Note: The password hash above is a placeholder. In production, use a proper bcrypt hash.
-- To generate a proper hash, use: bcrypt.hash('admin123', 10)

