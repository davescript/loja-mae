#!/bin/bash

# Script para atualizar secrets do Stripe no Cloudflare Workers

set -e

echo "🔐 Atualizando secrets do Stripe..."
echo ""

# Verificar se .dev.vars existe
if [ ! -f ".dev.vars" ]; then
  echo "❌ Arquivo .dev.vars não encontrado!"
  exit 1
fi

# Carregar variáveis
source .dev.vars

# Verificar se as variáveis estão definidas
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY não encontrado em .dev.vars"
  exit 1
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "❌ STRIPE_PUBLISHABLE_KEY não encontrado em .dev.vars"
  exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "❌ STRIPE_WEBHOOK_SECRET não encontrado em .dev.vars"
  exit 1
fi

echo "✅ Variáveis encontradas em .dev.vars"
echo ""

# Verificar autenticação
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Não autenticado. Execute: npx wrangler login"
  exit 1
fi

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
npx wrangler secret list --env production | grep -i stripe || echo "⚠️  Nenhum secret do Stripe encontrado (pode levar alguns segundos para aparecer)"

echo ""
echo "🎉 Pronto! Os secrets do Stripe foram atualizados."

