#!/bin/bash

# Script para atualizar apenas a STRIPE_SECRET_KEY

set -e

echo "🔐 Atualizando STRIPE_SECRET_KEY..."
echo ""

# Verificar se .dev.vars existe
if [ ! -f ".dev.vars" ]; then
  echo "❌ Arquivo .dev.vars não encontrado!"
  exit 1
fi

# Carregar variáveis
source .dev.vars

# Verificar se a variável está definida
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY não encontrado em .dev.vars"
  exit 1
fi

# Verificar se é uma restricted key
if [[ "$STRIPE_SECRET_KEY" == rk_* ]]; then
  echo "⚠️  ATENÇÃO: Você está usando uma Restricted Key (rk_live_...)"
  echo ""
  echo "❌ Restricted Keys NÃO podem criar Payment Intents!"
  echo ""
  echo "✅ Você precisa usar uma Secret Key (sk_live_...)"
  echo ""
  echo "📋 Como obter:"
  echo "   1. Acesse: https://dashboard.stripe.com/apikeys"
  echo "   2. Procure pela 'Secret key' (não Restricted key)"
  echo "   3. A Secret Key começa com 'sk_live_...'"
  echo "   4. Atualize o .dev.vars com a Secret Key correta"
  echo ""
  exit 1
fi

# Verificar se é uma secret key
if [[ "$STRIPE_SECRET_KEY" != sk_* ]]; then
  echo "⚠️  ATENÇÃO: A chave não parece ser uma Secret Key válida"
  echo "   Secret Keys devem começar com 'sk_live_' ou 'sk_test_'"
  echo ""
  read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
  fi
fi

# Remover token antigo
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# Verificar autenticação
if ! npx wrangler whoami &>/dev/null; then
  echo "❌ Não autenticado. Execute: npx wrangler login"
  exit 1
fi

echo "✅ Secret Key válida detectada: ${STRIPE_SECRET_KEY:0:20}..."
echo ""
echo "🔑 Atualizando STRIPE_SECRET_KEY no Cloudflare Workers..."
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production

echo ""
echo "✅ STRIPE_SECRET_KEY atualizada com sucesso!"
echo ""
echo "🧪 Teste o checkout agora: https://www.leiasabores.pt/checkout"

