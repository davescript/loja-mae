#!/bin/bash

# Script para fazer deploy com autenticação limpa

set -e

echo "🧹 Limpando autenticação antiga..."
echo ""

# Remover token de todas as formas possíveis
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# Fazer logout
echo "🔓 Fazendo logout..."
npx wrangler logout 2>/dev/null || true

# Fazer login
echo "🔑 Fazendo login..."
npx wrangler login

echo ""
echo "✅ Autenticado!"
echo ""

# Verificar TypeScript
echo "🔍 Verificando TypeScript..."
if ! npm run typecheck; then
  echo "❌ Erros de TypeScript encontrados. Corrija antes de fazer deploy."
  exit 1
fi

echo ""
echo "🚀 Fazendo deploy..."
npm run deploy:backend

echo ""
echo "✅ Deploy concluído!"

