#!/bin/bash

# Script para testar deploy do frontend no Cloudflare Pages

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testando deploy do frontend no Cloudflare Pages...${NC}"
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

echo -e "${GREEN}✅ Build concluído!${NC}"
echo ""

# Verificar tamanho do build
SIZE=$(du -sh dist | cut -f1)
echo -e "${BLUE}📊 Tamanho do build: ${SIZE}${NC}"
echo ""

# Deploy
echo -e "${YELLOW}📤 Fazendo deploy para Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=loja-mae-frontend

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo "   • Pages Dev: https://loja-mae-frontend.pages.dev"
echo "   • Custom: https://leiasabores.pt (se configurado)"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "   1. Verificar se o site está funcionando"
echo "   2. Verificar console do navegador para erros"
echo "   3. Testar conexão com a API"
echo "   4. Configurar variáveis de ambiente no Pages (se necessário)"
echo ""

