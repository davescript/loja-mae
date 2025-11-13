#!/bin/bash

# Script para configurar secrets de email com os valores corretos
# Email: davecdl@outlook.com
# Nome: Leia Sabores

echo "📧 Configurando secrets de email..."
echo ""

FROM_EMAIL="davecdl@outlook.com"
FROM_NAME="Leia Sabores"

echo "Email remetente: $FROM_EMAIL"
echo "Nome remetente: $FROM_NAME"
echo ""

# Verificar autenticação primeiro
echo "Verificando autenticação..."
if ! npx wrangler whoami > /dev/null 2>&1; then
  echo "❌ Erro: Você precisa fazer login primeiro!"
  echo ""
  echo "Execute:"
  echo "  npx wrangler logout"
  echo "  npx wrangler login"
  echo ""
  exit 1
fi

echo "✅ Autenticado!"
echo ""

# Configurar FROM_EMAIL
echo "Configurando FROM_EMAIL..."
echo "$FROM_EMAIL" | npx wrangler secret put FROM_EMAIL --env production

if [ $? -eq 0 ]; then
  echo "✅ FROM_EMAIL configurado com sucesso!"
else
  echo "❌ Erro ao configurar FROM_EMAIL"
  exit 1
fi

echo ""

# Configurar FROM_NAME
echo "Configurando FROM_NAME..."
echo "$FROM_NAME" | npx wrangler secret put FROM_NAME --env production

if [ $? -eq 0 ]; then
  echo "✅ FROM_NAME configurado com sucesso!"
else
  echo "❌ Erro ao configurar FROM_NAME"
  exit 1
fi

echo ""
echo "🎉 Secrets configurados com sucesso!"
echo ""
echo "Valores configurados:"
echo "  FROM_EMAIL: $FROM_EMAIL"
echo "  FROM_NAME: $FROM_NAME"
echo ""
echo "Para verificar:"
echo "  npx wrangler secret list --env production"

