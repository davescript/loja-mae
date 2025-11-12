-- Script SQL para criar admin manualmente
-- Execute este arquivo usando: npx wrangler d1 execute loja-mae-db --remote --file=./scripts/criar-admin-manual.sql
-- 
-- IMPORTANTE: Substitua o PASSWORD_HASH abaixo pelo hash bcrypt da sua senha
-- Para gerar o hash, execute: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('sua-senha', bcrypt.genSaltSync(10)));"

-- Remover admin existente se houver
DELETE FROM admins WHERE email = 'admin@loja-mae.com';

-- Criar novo admin
-- SUBSTITUA O PASSWORD_HASH ABAIXO PELO HASH GERADO!
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '$2a$10$YOUR_HASH_HERE', -- Substitua pelo hash gerado (veja instruções abaixo)
  'Administrador',
  'super_admin',
  1
);

-- Para criar com senha personalizada, gere o hash primeiro:
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('sua-senha-aqui', bcrypt.genSaltSync(10)));"
-- Depois substitua o PASSWORD_HASH acima pelo hash gerado

