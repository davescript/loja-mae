#!/bin/bash

# Script para adicionar um produto de exemplo via API
# Este script demonstra como criar um produto com imagens

API_URL="${API_URL:-https://loja-mae-api.davecdl.workers.dev}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@loja-mae.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "🔐 Fazendo login como admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login. Verifique as credenciais."
  echo "Resposta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login realizado com sucesso!"
echo ""

echo "📦 Criando produto de exemplo..."
echo ""

# Nota: Para adicionar imagens reais, você precisaria de arquivos de imagem
# Este exemplo mostra como seria com FormData

cat << EOF
Para adicionar um produto com imagens, use:

curl -X POST "${API_URL}/api/products" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -F "title=Produto Exemplo" \\
  -F "description=Descrição completa do produto exemplo" \\
  -F "short_description=Descrição curta" \\
  -F "price_cents=29990" \\
  -F "compare_at_price_cents=34990" \\
  -F "sku=EXEMP-001" \\
  -F "stock_quantity=50" \\
  -F "status=active" \\
  -F "featured=1" \\
  -F "category_id=1" \\
  -F "meta_title=Produto Exemplo - Loja Mãe" \\
  -F "meta_description=Descrição SEO do produto" \\
  -F "images=@/caminho/para/imagem1.jpg" \\
  -F "images=@/caminho/para/imagem2.jpg" \\
  -F "image_alt_0=Imagem principal" \\
  -F "image_alt_1=Imagem secundária"

EOF

echo ""
echo "🧪 Testando criação de produto (sem imagens)..."
echo ""

PRODUCT_RESPONSE=$(curl -s -X POST "${API_URL}/api/products" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "title=Produto Teste via Script" \
  -F "description=Este é um produto de teste criado via script" \
  -F "short_description=Produto teste" \
  -F "price_cents=19990" \
  -F "compare_at_price_cents=24990" \
  -F "sku=TEST-SCRIPT-001" \
  -F "stock_quantity=25" \
  -F "status=active" \
  -F "featured=0" \
  -F "category_id=1" \
  -F "meta_title=Produto Teste - Loja Mãe" \
  -F "meta_description=Produto de teste criado via script")

echo "$PRODUCT_RESPONSE" | jq '.' 2>/dev/null || echo "$PRODUCT_RESPONSE"

echo ""
echo "✅ Script concluído!"
echo ""
echo "📝 Para ver o produto criado:"
echo "   curl \"${API_URL}/api/products?status=active\" | jq"

