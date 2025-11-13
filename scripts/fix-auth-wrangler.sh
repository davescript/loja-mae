#!/bin/bash

# Script para corrigir autenticação do Wrangler
# Este script ajuda a reautenticar o Wrangler com Cloudflare

echo "🔐 Corrigindo autenticação do Wrangler..."
echo ""

# Verificar se há token de API configurado
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "⚠️  Token de API encontrado na variável de ambiente"
  echo "   Para usar login interativo, remova o token primeiro:"
  echo "   unset CLOUDFLARE_API_TOKEN"
  echo ""
  read -p "Deseja remover o token e fazer login interativo? (s/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    unset CLOUDFLARE_API_TOKEN
    echo "✅ Token removido"
  fi
fi

echo ""
echo "📋 Opções de autenticação:"
echo ""
echo "1. Login interativo (recomendado) - Abre navegador"
echo "2. Usar token de API existente"
echo ""
read -p "Escolha uma opção (1 ou 2): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[1]$ ]]; then
  echo "🌐 Abrindo navegador para login..."
  npx wrangler login
elif [[ $REPLY =~ ^[2]$ ]]; then
  echo ""
  echo "Para usar token de API, você precisa:"
  echo "1. Criar um token em: https://dash.cloudflare.com/profile/api-tokens"
  echo "2. Dar as seguintes permissões:"
  echo "   - Account → Cloudflare Workers → Edit"
  echo "   - Account → Workers Scripts → Edit"
  echo "   - Account → Workers Routes → Edit"
  echo "   - User → User Details → Read"
  echo ""
  echo "3. Configurar a variável:"
  echo "   export CLOUDFLARE_API_TOKEN='seu-token-aqui'"
  echo ""
else
  echo "❌ Opção inválida"
  exit 1
fi

echo ""
echo "✅ Autenticação configurada!"
echo ""
echo "Agora você pode configurar os secrets:"
echo "  ./scripts/configurar-secrets-email.sh"

