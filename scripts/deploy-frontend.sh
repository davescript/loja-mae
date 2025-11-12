#!/bin/bash

# Script para fazer deploy do frontend no Cloudflare Pages
# Uso: ./scripts/deploy-frontend.sh

set -e

echo "🚀 Iniciando deploy do frontend..."
echo ""

# 1. Build
echo "📦 Fazendo build do frontend..."
npm run build:frontend

# 2. Verificar build
echo ""
echo "✅ Verificando build..."
if [ ! -f "dist/index.html" ]; then
  echo "❌ Erro: dist/index.html não encontrado!"
  exit 1
fi

# Verificar se o HTML está correto
if grep -q "/frontend/main.tsx" dist/index.html; then
  echo "❌ Erro: HTML ainda contém /frontend/main.tsx!"
  echo "   O build não está correto."
  exit 1
fi

if ! grep -q "/assets/index-" dist/index.html; then
  echo "❌ Erro: HTML não contém /assets/index-*.js!"
  exit 1
fi

echo "✅ Build verificado - HTML está correto!"

# 3. Copiar arquivos necessários
echo ""
echo "📋 Copiando arquivos de configuração..."
cp public/_headers dist/_headers 2>/dev/null || echo "⚠️  _headers não encontrado em public/"
echo "/*    /index.html   200" > dist/_redirects
echo "✅ Arquivos copiados"

# 4. Deploy
echo ""
echo "🌐 Fazendo deploy para Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=loja-mae

echo ""
echo "════════════════════════════════════════"
echo "✅ DEPLOY CONCLUÍDO!"
echo "════════════════════════════════════════"
echo ""
echo "⏱️  Aguarde 30-60 segundos para propagar"
echo ""
echo "🧪 Teste agora:"
echo "   1. Limpe o cache (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "   2. Ou use uma janela anônima"
echo "   3. Acesse: https://www.leiasabores.pt"
echo ""
