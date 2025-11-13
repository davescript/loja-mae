#!/bin/bash

# Script para corrigir autenticação do Wrangler antes do deploy

echo "🔐 Corrigindo autenticação do Wrangler..."
echo ""

# Remover token antigo se existir
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "⚠️  CLOUDFLARE_API_TOKEN encontrado no ambiente"
  echo "   Removendo para usar OAuth..."
  unset CLOUDFLARE_API_TOKEN
fi

# Verificar se está autenticado
echo "🔍 Verificando autenticação..."
if npx wrangler whoami &>/dev/null; then
  echo "✅ Já autenticado!"
  npx wrangler whoami
else
  echo "❌ Não autenticado"
  echo ""
  echo "🔑 Fazendo login..."
  npx wrangler login
fi

echo ""
echo "✅ Pronto para deploy!"
echo ""
echo "Execute: npm run deploy:backend"
echo ""

