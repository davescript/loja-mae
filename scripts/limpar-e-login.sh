#!/bin/bash

# Script para limpar completamente credenciais e fazer login

echo "🧹 Limpando credenciais antigas do Wrangler..."
echo ""

# 1. Fazer logout
echo "1️⃣  Fazendo logout..."
npx wrangler logout 2>/dev/null || echo "   (Nenhuma sessão ativa)"
echo ""

# 2. Remover token de API se existir
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "2️⃣  Removendo token de API da variável de ambiente..."
  unset CLOUDFLARE_API_TOKEN
  echo "   ✅ Token removido"
  echo ""
fi

# 3. Limpar cache do Wrangler (opcional, mas ajuda)
echo "3️⃣  Limpando cache do Wrangler..."
rm -rf ~/.wrangler/config/default.toml 2>/dev/null
rm -rf ~/.wrangler/config/default.json 2>/dev/null
echo "   ✅ Cache limpo"
echo ""

# 4. Fazer login
echo "4️⃣  Fazendo login interativo..."
echo "   (Isso abrirá seu navegador para autenticação)"
echo ""
npx wrangler login

# 5. Verificar
echo ""
echo "5️⃣  Verificando autenticação..."
if npx wrangler whoami > /dev/null 2>&1; then
  echo "   ✅ Autenticação bem-sucedida!"
  echo ""
  echo "📧 Agora você pode configurar os secrets de email:"
  echo "   ./scripts/configurar-secrets-email.sh"
  echo ""
  echo "   Ou manualmente:"
  echo "   echo 'noreply@leiasabores.pt' | npx wrangler secret put FROM_EMAIL --env production"
  echo "   echo 'Loja Mãe' | npx wrangler secret put FROM_NAME --env production"
else
  echo "   ❌ Falha na autenticação."
  echo ""
  echo "   Tente novamente ou verifique:"
  echo "   - Você tem acesso à conta Cloudflare?"
  echo "   - O navegador abriu para login?"
  exit 1
fi

