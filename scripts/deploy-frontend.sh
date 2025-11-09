#!/bin/bash

# Script para fazer deploy do frontend no Cloudflare Pages

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploy do Frontend no Cloudflare Pages...${NC}"
echo ""

# Verificar se está autenticado
if ! npx wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Erro: Você não está autenticado no Cloudflare${NC}"
    echo "Execute: npx wrangler login"
    exit 1
fi

# Build do frontend
echo -e "${YELLOW}📦 Buildando frontend...${NC}"
npm run build:frontend

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Diretório dist não encontrado${NC}"
    exit 1
fi

# Deploy
echo -e "${YELLOW}📤 Fazendo deploy para Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=loja-mae-frontend

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${YELLOW}📍 URL: https://loja-mae-frontend.pages.dev${NC}"
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo "   1. Configure domínio customizado no Cloudflare Pages"
echo "   2. Configure variáveis de ambiente"
echo "   3. Veja DEPLOY_FRONTEND.md para mais detalhes"

