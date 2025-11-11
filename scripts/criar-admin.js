/**
 * Script para criar usuário admin no banco de dados
 * 
 * Uso:
 *   node scripts/criar-admin.js
 * 
 * Este script:
 * 1. Gera um hash bcrypt da senha
 * 2. Cria o usuário admin no banco D1
 */

import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import fs from 'fs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@loja-mae.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';
const DB_NAME = process.env.DB_NAME || 'loja-mae-db';
const REMOTE = process.env.REMOTE !== 'false'; // Default: true (remote)

async function criarAdmin() {
  try {
    console.log('🔐 Gerando hash da senha...');
    
    // Gerar hash bcrypt da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    console.log('✅ Hash gerado:', passwordHash);
    console.log('');
    console.log('📝 Criando admin no banco de dados...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Nome: ${ADMIN_NAME}`);
    console.log('');
    
    // SQL para criar/atualizar admin
    const sql = `
-- Remover admin existente se houver
DELETE FROM admins WHERE email = '${ADMIN_EMAIL}';

-- Criar novo admin
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  '${ADMIN_EMAIL}',
  '${passwordHash}',
  '${ADMIN_NAME}',
  'super_admin',
  1
);
`;

    // Salvar SQL em arquivo temporário
    const tempFile = './scripts/temp-admin.sql';
    fs.writeFileSync(tempFile, sql);
    
    // Executar no D1
    const remoteFlag = REMOTE ? '--remote' : '';
    const command = `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${tempFile}`;
    
    console.log('🚀 Executando comando:', command);
    console.log('');
    
    const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempFile);
    
    console.log('');
    console.log('✅ Admin criado com sucesso!');
    console.log('');
    console.log('🔑 Credenciais:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log('');
    console.log('🧪 Testar login:');
    console.log(`   curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email":"${ADMIN_EMAIL}","password":"${ADMIN_PASSWORD}"}'`);
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
criarAdmin();

export { criarAdmin };

