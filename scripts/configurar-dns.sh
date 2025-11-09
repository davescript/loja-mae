#!/bin/bash

# Script para configurar DNS record para API

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configurando DNS para API...${NC}"
echo ""

ZONE_NAME="leiasabores.pt"
SUBDOMAIN="api"
WORKER_URL="loja-mae-api.davecdl.workers.dev"

echo -e "${YELLOW}📋 Configuração:${NC}"
echo "   Zone: ${ZONE_NAME}"
echo "   Subdomain: ${SUBDOMAIN}"
echo "   Target: ${WORKER_URL}"
echo "   Full URL: https://${SUBDOMAIN}.${ZONE_NAME}"
echo ""

echo -e "${BLUE}📝 Instruções:${NC}"
echo ""
echo "1. Acesse o Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/${ZONE_NAME}/dns/records"
echo ""
echo "2. Clique em '+ Add record'"
echo ""
echo "3. Configure o registro:"
echo "   - Type: CNAME"
echo "   - Name: ${SUBDOMAIN}"
echo "   - Target: ${WORKER_URL}"
echo "   - Proxy status: ✅ Proxied (nuvem laranja)"
echo "   - TTL: Auto"
echo ""
echo "4. Clique em 'Save'"
echo ""
echo "5. Aguarde a propagação (pode levar alguns minutos)"
echo ""
echo "6. Teste a API:"
echo "   curl https://${SUBDOMAIN}.${ZONE_NAME}/api/health"
echo ""
echo -e "${GREEN}✅ DNS record configurado!${NC}"
echo ""

