#!/bin/bash

# Script para criar admin via API REST do Cloudflare
# Requer: CLOUDFLARE_API_TOKEN e ACCOUNT_ID configurados

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-55b0027975cda6f67a48ea231d2cef8d}"
DB_ID="9815d658-ce3b-4b8a-be98-90563c950182"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@loja-mae.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
ADMIN_NAME="${ADMIN_NAME:-Administrador}"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN não configurado"
  echo ""
  echo "Configure o token:"
  echo "  export CLOUDFLARE_API_TOKEN=seu_token_aqui"
  echo ""
  echo "Ou faça login interativo:"
  echo "  unset CLOUDFLARE_API_TOKEN"
  echo "  npx wrangler login"
  exit 1
fi

echo "🔐 Gerando hash da senha..."
PASSWORD_HASH=$(node -e "
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('$ADMIN_PASSWORD', salt);
console.log(hash);
")

if [ -z "$PASSWORD_HASH" ]; then
  echo "❌ Erro ao gerar hash. Instale bcryptjs: npm install bcryptjs"
  exit 1
fi

echo "✅ Hash gerado"
echo ""

SQL=$(cat <<EOF
DELETE FROM admins WHERE email = '$ADMIN_EMAIL';
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  '$ADMIN_EMAIL',
  '$PASSWORD_HASH',
  '$ADMIN_NAME',
  'super_admin',
  1
);
EOF
)

echo "📝 SQL a ser executado:"
echo "$SQL"
echo ""

# Executar via API REST do Cloudflare
echo "🚀 Executando via API REST do Cloudflare..."

RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/query" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sql\":\"$SQL\"}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' || echo "")

if [ -n "$SUCCESS" ]; then
  echo ""
  echo "✅ Admin criado com sucesso!"
  echo ""
  echo "🔑 Credenciais:"
  echo "   Email: $ADMIN_EMAIL"
  echo "   Senha: $ADMIN_PASSWORD"
else
  echo ""
  echo "❌ Erro ao criar admin"
  echo "Verifique se o token tem permissões para D1"
fi

