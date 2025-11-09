#!/bin/bash

# Script para configurar e fazer deploy no GitHub

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Configurando deploy para GitHub...${NC}"
echo ""

# Verificar se git está inicializado
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erro: Git não está inicializado${NC}"
    echo "Execute: git init"
    exit 1
fi

# Verificar se há commits
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Nenhum commit encontrado. Fazendo commit inicial...${NC}"
    git add .
    git commit -m "Initial commit: E-commerce completo full stack"
fi

# Solicitar informações do usuário
echo -e "${YELLOW}📋 Informações do repositório GitHub:${NC}"
read -p "Digite seu usuário GitHub: " GITHUB_USER
read -p "Nome do repositório (padrão: loja-mae): " REPO_NAME
REPO_NAME=${REPO_NAME:-loja-mae}

# Verificar se repositório existe
echo -e "${YELLOW}🔍 Verificando repositório...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://github.com/${GITHUB_USER}/${REPO_NAME}" | grep -q "200"; then
    echo -e "${GREEN}✅ Repositório encontrado!${NC}"
else
    echo -e "${YELLOW}⚠️  Repositório não encontrado.${NC}"
    echo -e "${BLUE}📝 Crie o repositório em: https://github.com/new${NC}"
    echo -e "${BLUE}   Nome: ${REPO_NAME}${NC}"
    echo -e "${BLUE}   NÃO inicialize com README, .gitignore ou license${NC}"
    read -p "Pressione Enter quando o repositório estiver criado..."
fi

# Remover remote antigo se existir
if git remote get-url origin >/dev/null 2>&1; then
    echo -e "${YELLOW}🔄 Removendo remote antigo...${NC}"
    git remote remove origin
fi

# Adicionar novo remote
echo -e "${GREEN}➕ Adicionando remote...${NC}"
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

# Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}🔄 Renomeando branch para main...${NC}"
    git branch -M main
fi

# Fazer push
echo -e "${GREEN}📤 Fazendo push para GitHub...${NC}"
git push -u origin main || {
    echo -e "${RED}❌ Erro ao fazer push${NC}"
    echo -e "${YELLOW}💡 Dicas:${NC}"
    echo "   - Verifique suas credenciais do GitHub"
    echo "   - Use um Personal Access Token se necessário"
    echo "   - Verifique se o repositório existe e você tem permissão"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}📍 Repositório: https://github.com/${GITHUB_USER}/${REPO_NAME}${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "1. Configure secrets no GitHub:"
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo "2. Acesse: https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions"
echo "3. Adicione os secrets para habilitar deploy automático"

