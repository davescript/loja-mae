#!/bin/bash

# Script para limpar produtos de exemplo do banco de dados
# Uso: ./scripts/limpar-produtos-exemplo.sh [--remote|--local]

set -e

REMOTE="${1:---local}"

echo "🧹 Limpando produtos de exemplo do banco de dados..."
echo "Modo: $REMOTE"
echo ""

if [ "$REMOTE" = "--remote" ]; then
  echo "⚠️  ATENÇÃO: Isso vai deletar produtos no banco de dados de PRODUÇÃO!"
  read -p "Tem certeza que deseja continuar? (digite 'sim' para confirmar): " confirm
  if [ "$confirm" != "sim" ]; then
    echo "❌ Operação cancelada."
    exit 1
  fi
  npx wrangler d1 execute loja-mae-db --remote --file=./scripts/limpar-produtos-exemplo.sql
else
  echo "🗑️  Deletando produtos de exemplo do banco LOCAL..."
  npx wrangler d1 execute loja-mae-db --local --file=./scripts/limpar-produtos-exemplo.sql
fi

echo ""
echo "✅ Produtos de exemplo removidos!"
echo ""
echo "📊 Estatísticas do banco:"
if [ "$REMOTE" = "--remote" ]; then
  npx wrangler d1 execute loja-mae-db --remote --command="SELECT COUNT(*) as total_produtos FROM products;"
else
  npx wrangler d1 execute loja-mae-db --local --command="SELECT COUNT(*) as total_produtos FROM products;"
fi

