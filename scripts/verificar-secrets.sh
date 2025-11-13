#!/bin/bash

# Script para verificar secrets sem problemas de autenticação

set -e

echo "🔍 Verificando secrets configurados..."
echo ""

# Remover token antes de verificar
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# Verificar autenticação primeiro
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Não autenticado. Execute: npx wrangler login"
  exit 1
fi

echo "✅ Autenticado!"
echo ""
echo "📋 Secrets configurados:"
echo ""

# Listar todos os secrets
npx wrangler secret list --env production 2>&1 | grep -E '"name"' | sed 's/.*"name": "\(.*\)".*/\1/' | sort

echo ""
echo "🔐 Secrets do Stripe:"
npx wrangler secret list --env production 2>&1 | grep -i stripe || echo "⚠️  Nenhum secret do Stripe encontrado"

echo ""
echo "✅ Verificação concluída!"

