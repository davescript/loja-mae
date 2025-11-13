#!/bin/bash

# Script para fazer deploy forçando OAuth e limpando tudo

set -e

echo "🔐 Deploy forçado com limpeza completa..."
echo ""

# 1. Remover TODAS as variáveis de ambiente relacionadas
echo "🧹 Limpando variáveis de ambiente..."
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true
export -n CLOUDFLARE_ACCOUNT_ID 2>/dev/null || true

# 2. Fazer logout
echo "🔓 Fazendo logout..."
npx wrangler logout 2>/dev/null || true

# 3. Limpar cache completamente
echo "🗑️  Limpando cache do Wrangler..."
rm -rf ~/.wrangler/state 2>/dev/null || true
rm -rf ~/.wrangler/.dev.vars 2>/dev/null || true

# 4. Aguardar um pouco
sleep 2

# 5. Fazer login via OAuth
echo "🔑 Fazendo login via OAuth..."
npx wrangler login

# 6. Verificar autenticação
echo ""
echo "✅ Verificando autenticação..."
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Falha na autenticação"
  exit 1
fi

# 7. Type check
echo ""
echo "🔍 Verificando TypeScript..."
npm run typecheck || {
  echo "❌ Erros de TypeScript encontrados"
  exit 1
}

# 8. Deploy
echo ""
echo "🚀 Fazendo deploy..."
npx wrangler deploy --env production

echo ""
echo "✅ Deploy concluído com sucesso!"

