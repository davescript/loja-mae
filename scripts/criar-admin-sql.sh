#!/bin/bash

# Script para criar admin via SQL direto
# Uso: ./scripts/criar-admin-sql.sh [--local|--remote]

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@loja-mae.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
ADMIN_NAME="${ADMIN_NAME:-Administrador}"
DB_NAME="${DB_NAME:-loja-mae-db}"

# Verificar se bcryptjs está instalado
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
  exit 1
fi

# Gerar hash da senha usando Node.js
echo "🔐 Gerando hash da senha..."
PASSWORD_HASH=$(node -e "
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('$ADMIN_PASSWORD', salt);
console.log(hash);
")

if [ -z "$PASSWORD_HASH" ]; then
  echo "❌ Erro ao gerar hash da senha. Certifique-se de que bcryptjs está instalado: npm install bcryptjs"
  exit 1
fi

echo "✅ Hash gerado"
echo ""

# Criar arquivo SQL temporário
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" << EOF
-- Remover admin existente se houver
DELETE FROM admins WHERE email = '$ADMIN_EMAIL';

-- Criar novo admin
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  '$ADMIN_EMAIL',
  '$PASSWORD_HASH',
  '$ADMIN_NAME',
  'super_admin',
  1
);
EOF

echo "📝 SQL gerado:"
cat "$SQL_FILE"
echo ""
echo ""

# Determinar modo (local ou remote)
if [ "$1" == "--local" ]; then
  MODE="--local"
  echo "📍 Modo: LOCAL"
elif [ "$1" == "--remote" ]; then
  MODE="--remote"
  echo "📍 Modo: REMOTO"
else
  echo "⚠️  Modo não especificado. Use --local ou --remote"
  echo "   Exemplo: $0 --remote"
  echo ""
  read -p "Executar no banco REMOTO? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    MODE="--remote"
  else
    MODE="--local"
  fi
fi

echo ""
echo "🚀 Executando SQL no banco de dados..."
echo ""

# Executar SQL
npx wrangler d1 execute "$DB_NAME" $MODE --file="$SQL_FILE"

EXIT_CODE=$?

# Limpar arquivo temporário
rm -f "$SQL_FILE"

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Admin criado com sucesso!"
  echo ""
  echo "🔑 Credenciais:"
  echo "   Email: $ADMIN_EMAIL"
  echo "   Senha: $ADMIN_PASSWORD"
  echo ""
  echo "🧪 Testar login:"
  echo "   curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \\"
  echo "     -H \"Content-Type: application/json\" \\"
  echo "     -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}'"
else
  echo ""
  echo "❌ Erro ao criar admin. Código de saída: $EXIT_CODE"
  exit $EXIT_CODE
fi

