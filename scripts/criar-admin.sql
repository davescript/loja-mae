-- Script para criar usuário admin
-- Execute: npx wrangler d1 execute loja-mae-db --remote --file=./scripts/criar-admin.sql

-- Senha: admin123
-- Hash bcrypt: $2a$10$rOzJqZrZrJqZrJqZrJqZrOuJqZrJqZrJqZrJqZrJqZrJqZrJqZrJq
-- (Este hash é apenas um exemplo - você precisa gerar um hash real)

-- Remover admin existente se houver
DELETE FROM admins WHERE email = 'admin@loja-mae.com';

-- Criar novo admin
-- NOTA: Você precisa gerar um hash bcrypt real da senha 'admin123'
-- Use: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '$2a$10$rOzJqZrZrJqZrJqZrJqZrOuJqZrJqZrJqZrJqZrJqZrJqZrJqZrJq', -- Substitua por hash real
  'Administrador',
  'super_admin',
  1
);

