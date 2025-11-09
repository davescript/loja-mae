#!/bin/bash

# Script para configurar secrets no GitHub usando a API

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

GITHUB_USER="davescript"
REPO_NAME="loja-mae"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
CLOUDFLARE_TOKEN="${CLOUDFLARE_TOKEN:-mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk}"

echo -e "${BLUE}🔐 Configurando secrets no GitHub...${NC}"
echo ""

# Obter Account ID do Cloudflare
echo -e "${YELLOW}📡 Obtendo Account ID do Cloudflare...${NC}"
ACCOUNT_ID=$(curl -s -H "Authorization: Bearer ${CLOUDFLARE_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ACCOUNT_ID" ]; then
  echo -e "${RED}❌ Erro ao obter Account ID${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Account ID: ${ACCOUNT_ID}${NC}"
echo ""

# Função para criar/atualizar secret
create_secret() {
  local secret_name=$1
  local secret_value=$2
  
  echo -e "${YELLOW}🔧 Configurando ${secret_name}...${NC}"
  
  # Obter public key do repositório
  PUBLIC_KEY_RESPONSE=$(curl -s -X GET \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/actions/secrets/public-key")
  
  PUBLIC_KEY=$(echo "$PUBLIC_KEY_RESPONSE" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
  KEY_ID=$(echo "$PUBLIC_KEY_RESPONSE" | grep -o '"key_id":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$PUBLIC_KEY" ] || [ -z "$KEY_ID" ]; then
    echo -e "${RED}❌ Erro ao obter chave pública do repositório${NC}"
    return 1
  fi
  
  # Criptografar o secret usando a chave pública (requer sodium ou similar)
  # Por simplicidade, vamos usar a API do GitHub diretamente
  # Nota: A API do GitHub requer que o secret seja criptografado com a chave pública
  # Isso normalmente requer bibliotecas como libsodium
  
  echo -e "${YELLOW}⚠️  Configuração manual necessária${NC}"
  echo -e "${BLUE}   Acesse: https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions${NC}"
  echo -e "${BLUE}   Adicione: ${secret_name} = ${secret_value}${NC}"
  echo ""
}

echo -e "${GREEN}📋 Secrets para configurar no GitHub:${NC}"
echo ""
echo -e "${YELLOW}CLOUDFLARE_API_TOKEN${NC}"
echo "   ${CLOUDFLARE_TOKEN}"
echo ""
echo -e "${YELLOW}CLOUDFLARE_ACCOUNT_ID${NC}"
echo "   ${ACCOUNT_ID}"
echo ""
echo -e "${BLUE}🔗 Link para configurar:${NC}"
echo "   https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions"
echo ""
echo -e "${YELLOW}📝 Instruções:${NC}"
echo "1. Acesse o link acima"
echo "2. Clique em 'New repository secret'"
echo "3. Adicione CLOUDFLARE_API_TOKEN com o valor acima"
echo "4. Adicione CLOUDFLARE_ACCOUNT_ID com o valor acima"
echo ""

