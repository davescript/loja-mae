#!/bin/bash

# Script para configurar secrets no GitHub
# Veja CONFIGURAR_SECRETS.md para valores dos tokens

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GITHUB_USER="davescript"
REPO_NAME="loja-mae"
ACCOUNT_ID="55b0027975cda6f67a48ea231d2cef8d"

echo -e "${BLUE}🔐 Configurar Secrets no GitHub${NC}"
echo ""
echo -e "${YELLOW}📝 Acesse o link abaixo para configurar os secrets:${NC}"
echo ""
echo -e "${BLUE}🔗 https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions${NC}"
echo ""
echo -e "${GREEN}Secrets necessários:${NC}"
echo "1. CLOUDFLARE_API_TOKEN"
echo "   (Veja CONFIGURAR_SECRETS.md para o valor)"
echo ""
echo "2. CLOUDFLARE_ACCOUNT_ID"
echo "   ${ACCOUNT_ID}"
echo ""
echo -e "${YELLOW}💡 Para usar GitHub CLI:${NC}"
echo "   gh secret set CLOUDFLARE_API_TOKEN -b '<token>' -R ${GITHUB_USER}/${REPO_NAME}"
echo "   gh secret set CLOUDFLARE_ACCOUNT_ID -b '${ACCOUNT_ID}' -R ${GITHUB_USER}/${REPO_NAME}"
echo ""
echo -e "${YELLOW}📚 Veja CONFIGURAR_SECRETS.md para instruções completas${NC}"
