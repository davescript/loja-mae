/**
 * Script para popular o banco de dados com produtos de exemplo
 * Execute: npx tsx scripts/popular-produtos.ts
 */

import { getDb, getR2Bucket } from '../backend/utils/db';
import { createProduct, addProductImage } from '../backend/modules/products';
import { createCategory } from '../backend/modules/categories';

// Mock environment for local execution
const mockEnv = {
  DB: null as any,
  R2: null as any,
};

async function popularBanco() {
  console.log('🚀 Iniciando popularização do banco de dados...\n');

  // Nota: Este script deve ser executado via API ou via Worker
  // Para executar localmente, você precisa ter acesso ao D1 e R2
  console.log('📋 Este script deve ser executado via API do Worker');
  console.log('   Use: POST /api/products para criar produtos');
  console.log('   Use: POST /api/categories para criar categorias');
  console.log('');
  console.log('💡 Ou use o script de seed SQL: npm run d1:seed');
}

popularBanco().catch(console.error);

