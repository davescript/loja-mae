#!/bin/bash

# Script de setup inicial do projeto Loja Mãe

set -e

echo "🚀 Configurando Loja Mãe..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}Wrangler não encontrado. Instalando...${NC}"
    npm install -g wrangler
fi

# Verificar autenticação
echo -e "${GREEN}Verificando autenticação Cloudflare...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Você não está autenticado. Fazendo login...${NC}"
    wrangler login
fi

# Criar banco D1
echo -e "${GREEN}Criando banco D1...${NC}"
DB_OUTPUT=$(wrangler d1 create loja-mae-db 2>&1)
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' | head -1)

if [ -z "$DB_ID" ]; then
    echo -e "${RED}Erro ao criar banco D1. Verifique as mensagens acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Banco D1 criado com ID: $DB_ID${NC}"

# Atualizar wrangler.toml
echo -e "${GREEN}Atualizando wrangler.toml...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
else
    # Linux
    sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
fi

# Criar bucket R2
echo -e "${GREEN}Criando bucket R2...${NC}"
wrangler r2 bucket create loja-mae-images || echo -e "${YELLOW}Bucket já existe ou erro ao criar${NC}"

# Executar migrations
echo -e "${GREEN}Executando migrations...${NC}"
wrangler d1 migrations apply loja-mae-db

# Criar .dev.vars se não existir
if [ ! -f .dev.vars ]; then
    echo -e "${GREEN}Criando .dev.vars...${NC}"
    cp .dev.vars.example .dev.vars
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite .dev.vars e adicione suas chaves secretas!${NC}"
fi

# Configurar secrets (opcional)
echo -e "${YELLOW}Deseja configurar os secrets agora? (s/n)${NC}"
read -r response
if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    echo -e "${GREEN}Configurando JWT_SECRET...${NC}"
    wrangler secret put JWT_SECRET
    
    echo -e "${GREEN}Configurando STRIPE_SECRET_KEY...${NC}"
    wrangler secret put STRIPE_SECRET_KEY
    
    echo -e "${GREEN}Configurando STRIPE_WEBHOOK_SECRET...${NC}"
    wrangler secret put STRIPE_WEBHOOK_SECRET
    
    echo -e "${GREEN}Configurando ALLOWED_ORIGINS...${NC}"
    wrangler secret put ALLOWED_ORIGINS
fi

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Edite .dev.vars com suas chaves secretas"
echo "2. Execute: npm run dev"
echo "3. Acesse: http://localhost:5173"

