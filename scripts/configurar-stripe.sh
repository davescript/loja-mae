#!/bin/bash

# Script para configurar as variáveis de ambiente do Stripe no Cloudflare Workers

set -e

echo "🔧 Configurando Stripe no Cloudflare Workers..."
echo ""

# Verificar se o arquivo .dev.vars existe
if [ ! -f ".dev.vars" ]; then
  echo "❌ Arquivo .dev.vars não encontrado!"
  exit 1
fi

# Verificar autenticação do Wrangler
echo "🔐 Verificando autenticação do Wrangler..."
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Não autenticado no Wrangler!"
  echo ""
  echo "Por favor, autentique-se primeiro:"
  echo "  1. Remova qualquer CLOUDFLARE_API_TOKEN: unset CLOUDFLARE_API_TOKEN"
  echo "  2. Execute: npx wrangler login"
  echo "  3. Execute este script novamente"
  exit 1
fi

echo "✅ Autenticado no Wrangler"
echo ""

# Ler variáveis do .dev.vars
source .dev.vars

# Verificar se as variáveis estão definidas
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY não encontrada no .dev.vars"
  exit 1
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "❌ STRIPE_PUBLISHABLE_KEY não encontrada no .dev.vars"
  exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "⚠️  STRIPE_WEBHOOK_SECRET não encontrada no .dev.vars (opcional para desenvolvimento)"
fi

echo "📝 Configurando secrets no Cloudflare Workers (produção)..."
echo ""

# Configurar STRIPE_SECRET_KEY
echo "1. Configurando STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production

# Configurar STRIPE_PUBLISHABLE_KEY
echo ""
echo "2. Configurando STRIPE_PUBLISHABLE_KEY..."
echo "$STRIPE_PUBLISHABLE_KEY" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production

# Configurar STRIPE_WEBHOOK_SECRET se existir
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  echo ""
  echo "3. Configurando STRIPE_WEBHOOK_SECRET..."
  echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
fi

echo ""
echo "✅ Stripe configurado com sucesso!"
echo ""
echo "📋 Variáveis configuradas em produção:"
echo "   - STRIPE_SECRET_KEY: ✅"
echo "   - STRIPE_PUBLISHABLE_KEY: ✅"
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "   - STRIPE_WEBHOOK_SECRET: ✅"
else
  echo "   - STRIPE_WEBHOOK_SECRET: ⚠️  (não configurado)"
fi
echo ""
echo "💡 Verificar configuração:"
echo "   npx wrangler secret list --env production"
echo ""
