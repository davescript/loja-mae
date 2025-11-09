#!/bin/bash

# Script de deploy para produção

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Iniciando deploy do backend...${NC}"

# Verificar se está autenticado
if ! npx wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Erro: Você não está autenticado no Cloudflare${NC}"
    echo "Execute: npx wrangler login"
    exit 1
fi

# Type check
echo -e "${YELLOW}📝 Verificando tipos TypeScript...${NC}"
npm run typecheck || {
    echo -e "${RED}❌ Erro: Falha na verificação de tipos${NC}"
    exit 1
}

# Deploy
echo -e "${YELLOW}📦 Fazendo deploy do backend...${NC}"
npx wrangler deploy

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${YELLOW}📍 URL do Worker: https://loja-mae-api.workers.dev${NC}"
echo -e "${YELLOW}📝 Para ver logs: npx wrangler tail${NC}"

