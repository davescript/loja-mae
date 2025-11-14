
-- Remover admin existente se houver
DELETE FROM admins WHERE email = 'admin@loja-mae.com';

-- Criar novo admin
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '$2a$10$Xgqz7AsQS13EX1wd3BDnmuAgdETGPEWy39BndZWRNtGF9QXFIjonC',
  'Administrador',
  'super_admin',
  1
);
