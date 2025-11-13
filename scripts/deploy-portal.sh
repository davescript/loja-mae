#!/bin/bash

# Script para fazer deploy do Portal do Cliente

set -e

echo "🚀 Deploy do Portal do Cliente"
echo ""

# 1. Remover token antigo
echo "🧹 Removendo token antigo..."
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# 2. Verificar TypeScript
echo "🔍 Verificando TypeScript..."
npm run typecheck || {
  echo "❌ Erros de TypeScript encontrados"
  exit 1
}

# 3. Fazer logout e login
echo "🔓 Fazendo logout..."
npx wrangler logout 2>/dev/null || true

echo "🔑 Fazendo login via OAuth..."
npx wrangler login

# 4. Verificar autenticação
echo ""
echo "✅ Verificando autenticação..."
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Falha na autenticação"
  exit 1
fi

# 5. Deploy
echo ""
echo "🚀 Fazendo deploy do backend..."
npx wrangler deploy --env production

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Executar migration: npm run d1:migrate"
echo "   2. O frontend será deployado automaticamente via GitHub Actions"
echo "   3. Acesse /account após fazer login no site"

