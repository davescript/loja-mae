#!/bin/bash

# Script completo para resolver problemas de autenticação

set -e

echo "🔐 Resolvendo problemas de autenticação Cloudflare..."
echo ""

# 1. Remover token de todas as formas possíveis
echo "🧹 Removendo token antigo..."
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# 2. Fazer logout
echo "🔓 Fazendo logout..."
npx wrangler logout 2>/dev/null || true

# 3. Limpar cache do Wrangler (opcional, mas ajuda)
echo "🗑️  Limpando cache..."
rm -rf ~/.wrangler/state 2>/dev/null || true

# 4. Fazer login via OAuth
echo "🔑 Fazendo login via OAuth..."
echo ""
npx wrangler login

# 5. Verificar autenticação
echo ""
echo "✅ Verificando autenticação..."
if npx wrangler whoami; then
  echo ""
  echo "✅ Autenticação OK!"
  echo ""
  echo "🧪 Testando comandos..."
  
  # Testar listar secrets
  echo ""
  echo "📋 Listando secrets..."
  if npx wrangler secret list --env production 2>&1 | head -20; then
    echo ""
    echo "✅ Secrets listados com sucesso!"
  else
    echo ""
    echo "⚠️  Ainda há problemas. Verifique as permissões do token OAuth."
  fi
else
  echo ""
  echo "❌ Falha na autenticação"
  exit 1
fi

echo ""
echo "🎉 Pronto! Agora você pode:"
echo "   - npm run deploy:backend"
echo "   - npx wrangler secret put ..."
echo "   - npx wrangler secret list --env production"

