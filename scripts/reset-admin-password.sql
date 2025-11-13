-- Script para resetar senha do admin ou criar novo admin
-- Senha padrão: admin123

-- Opção 1: Resetar senha do admin existente (admin@loja-mae.com)
-- O hash bcrypt de 'admin123' é: $2a$10$vlYfnpu.3uDpTwn1DxYb9OPR3/pzzycb9SwDR8pLnYcmGO6erBpdy
UPDATE admins 
SET password_hash = '$2a$10$vlYfnpu.3uDpTwn1DxYb9OPR3/pzzycb9SwDR8pLnYcmGO6erBpdy',
    updated_at = datetime('now')
WHERE email = 'admin@loja-mae.com';

-- Opção 2: Criar/atualizar admin com email davetrader007@gmail.com
-- Senha: admin123
INSERT OR REPLACE INTO admins (email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (
  'davetrader007@gmail.com',
  '$2a$10$vlYfnpu.3uDpTwn1DxYb9OPR3/pzzycb9SwDR8pLnYcmGO6erBpdy', -- bcrypt hash de 'admin123'
  'David Sousa',
  'super_admin',
  1,
  datetime('now'),
  datetime('now')
);

-- Verificar resultado
SELECT id, email, name, role, is_active FROM admins;

