#!/bin/bash

# Script para atualizar ALLOWED_ORIGINS no Cloudflare Workers

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Atualizando ALLOWED_ORIGINS...${NC}"
echo ""

# Domínios de produção
PROD_ORIGINS="https://leiasabores.pt,https://www.leiasabores.pt,https://api.leiasabores.pt"

# Domínios de desenvolvimento
DEV_ORIGINS="http://localhost:5173,http://localhost:3000"

# Combinar todos os domínios
ALL_ORIGINS="${PROD_ORIGINS},${DEV_ORIGINS}"

echo -e "${YELLOW}📋 Domínios a configurar:${NC}"
echo "   ${ALL_ORIGINS}" | tr ',' '\n' | sed 's/^/   - /'
echo ""

echo -e "${BLUE}🚀 Atualizando secret ALLOWED_ORIGINS para produção...${NC}"
echo "${ALL_ORIGINS}" | npx wrangler secret put ALLOWED_ORIGINS --name loja-mae-api --env production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ALLOWED_ORIGINS atualizado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao atualizar ALLOWED_ORIGINS${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Verificar:${NC}"
echo "   npx wrangler secret list --name loja-mae-api --env production"
echo ""

