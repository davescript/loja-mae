#!/bin/bash

# Script que apenas exibe os comandos para configurar Stripe manualmente

echo "📋 Comandos para configurar Stripe no Cloudflare Workers"
echo "=========================================================="
echo ""

# Verificar se o arquivo .dev.vars existe
if [ ! -f ".dev.vars" ]; then
  echo "❌ Arquivo .dev.vars não encontrado!"
  exit 1
fi

# Ler variáveis do .dev.vars
source .dev.vars

echo "1️⃣  Primeiro, autentique-se no Wrangler (se necessário):"
echo "   unset CLOUDFLARE_API_TOKEN"
echo "   npx wrangler login"
echo ""

echo "2️⃣  Execute os seguintes comandos:"
echo ""

if [ -n "$STRIPE_SECRET_KEY" ]; then
  echo "   # Configurar STRIPE_SECRET_KEY"
  echo "   echo \"$STRIPE_SECRET_KEY\" | npx wrangler secret put STRIPE_SECRET_KEY --env production"
  echo ""
fi

if [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "   # Configurar STRIPE_PUBLISHABLE_KEY"
  echo "   echo \"$STRIPE_PUBLISHABLE_KEY\" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production"
  echo ""
fi

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "   # Configurar STRIPE_WEBHOOK_SECRET"
  echo "   echo \"$STRIPE_WEBHOOK_SECRET\" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production"
  echo ""
fi

echo "3️⃣  Verificar configuração:"
echo "   npx wrangler secret list --env production"
echo ""

