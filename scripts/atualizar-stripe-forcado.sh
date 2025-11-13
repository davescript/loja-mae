#!/bin/bash

# Script para atualizar secrets do Stripe forçando OAuth

set -e

echo "🔐 Atualizando secrets do Stripe (forçando OAuth)..."
echo ""

# 1. Remover token de TODAS as formas possíveis
echo "🧹 Removendo token antigo..."
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# Remover de arquivos temporários
unset CLOUDFLARE_ACCOUNT_ID
export -n CLOUDFLARE_ACCOUNT_ID 2>/dev/null || true

# 2. Fazer logout forçado
echo "🔓 Fazendo logout..."
npx wrangler logout 2>/dev/null || true

# 3. Limpar cache do Wrangler
echo "🗑️  Limpando cache..."
rm -rf ~/.wrangler/state 2>/dev/null || true

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

# 7. Carregar variáveis
if [ ! -f ".dev.vars" ]; then
  echo "❌ Arquivo .dev.vars não encontrado!"
  exit 1
fi

source .dev.vars

# 8. Verificar variáveis
if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_PUBLISHABLE_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "❌ Variáveis do Stripe não encontradas em .dev.vars"
  exit 1
fi

echo ""
echo "🔑 Atualizando STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production

echo ""
echo "🔑 Atualizando STRIPE_PUBLISHABLE_KEY..."
echo "$STRIPE_PUBLISHABLE_KEY" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production

echo ""
echo "🔑 Atualizando STRIPE_WEBHOOK_SECRET..."
echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production

echo ""
echo "✅ Secrets atualizados com sucesso!"
echo ""
echo "📋 Verificando secrets configurados..."
npx wrangler secret list --env production | grep -i stripe || echo "⚠️  Secrets podem levar alguns segundos para aparecer"

echo ""
echo "🎉 Pronto! Os secrets do Stripe foram atualizados."

