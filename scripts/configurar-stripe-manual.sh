#!/bin/bash

# Script manual para configurar Stripe - passo a passo interativo

echo "🔧 Configuração Manual do Stripe no Cloudflare Workers"
echo "========================================================"
echo ""

# Verificar autenticação
echo "1️⃣  Verificando autenticação..."
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Não autenticado!"
  echo ""
  echo "Execute primeiro:"
  echo "   unset CLOUDFLARE_API_TOKEN"
  echo "   npx wrangler login"
  exit 1
fi

echo "✅ Autenticado"
echo ""

# Ler .dev.vars
if [ ! -f ".dev.vars" ]; then
  echo "❌ Arquivo .dev.vars não encontrado!"
  exit 1
fi

source .dev.vars

echo "2️⃣  Configurando variáveis..."
echo ""

# STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
  echo "📝 Configurando STRIPE_SECRET_KEY..."
  echo "Pressione Enter para continuar ou Ctrl+C para cancelar..."
  read
  echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production
  echo "✅ STRIPE_SECRET_KEY configurada"
  echo ""
else
  echo "⚠️  STRIPE_SECRET_KEY não encontrada no .dev.vars"
  echo ""
fi

# STRIPE_PUBLISHABLE_KEY
if [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "📝 Configurando STRIPE_PUBLISHABLE_KEY..."
  echo "Pressione Enter para continuar ou Ctrl+C para cancelar..."
  read
  echo "$STRIPE_PUBLISHABLE_KEY" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production
  echo "✅ STRIPE_PUBLISHABLE_KEY configurada"
  echo ""
else
  echo "⚠️  STRIPE_PUBLISHABLE_KEY não encontrada no .dev.vars"
  echo ""
fi

# STRIPE_WEBHOOK_SECRET
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "📝 Configurando STRIPE_WEBHOOK_SECRET..."
  echo "Pressione Enter para continuar ou Ctrl+C para cancelar..."
  read
  echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
  echo "✅ STRIPE_WEBHOOK_SECRET configurada"
  echo ""
else
  echo "⚠️  STRIPE_WEBHOOK_SECRET não encontrada no .dev.vars (opcional)"
  echo ""
fi

echo "✅ Configuração concluída!"
echo ""
echo "📋 Verificar:"
echo "   npx wrangler secret list --env production"
echo ""

