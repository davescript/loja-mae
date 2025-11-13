#!/bin/bash

# Script para configurar secrets de email no Cloudflare Workers
# Uso: ./scripts/configurar-secrets-email.sh

echo "📧 Configurando secrets de email para produção..."

# FROM_EMAIL - Email remetente
echo ""
echo "Digite o email remetente (ex: noreply@leiasabores.pt):"
read -r FROM_EMAIL

if [ -z "$FROM_EMAIL" ]; then
  echo "❌ Email não pode ser vazio!"
  exit 1
fi

echo "$FROM_EMAIL" | npx wrangler secret put FROM_EMAIL --env production

# FROM_NAME - Nome do remetente
echo ""
echo "Digite o nome do remetente (ex: Loja Mãe):"
read -r FROM_NAME

if [ -z "$FROM_NAME" ]; then
  FROM_NAME="Loja Mãe"
  echo "Usando nome padrão: $FROM_NAME"
fi

echo "$FROM_NAME" | npx wrangler secret put FROM_NAME --env production

echo ""
echo "✅ Secrets configurados com sucesso!"
echo ""
echo "FROM_EMAIL: $FROM_EMAIL"
echo "FROM_NAME: $FROM_NAME"

