#!/bin/bash

# Script para reautenticar o Wrangler completamente

echo "🔐 Reautenticando Wrangler com Cloudflare..."
echo ""

# Fazer logout primeiro
echo "1️⃣  Fazendo logout para limpar credenciais antigas..."
npx wrangler logout 2>/dev/null || echo "   (Nenhuma sessão ativa para limpar)"
echo ""

# Fazer login
echo "2️⃣  Fazendo login interativo..."
echo "   (Isso abrirá seu navegador para autenticação)"
echo ""
npx wrangler login

# Verificar se funcionou
echo ""
echo "3️⃣  Verificando autenticação..."
if npx wrangler whoami > /dev/null 2>&1; then
  echo "   ✅ Autenticação bem-sucedida!"
  echo ""
  echo "4️⃣  Agora você pode configurar os secrets:"
  echo "   ./scripts/configurar-secrets-email.sh"
else
  echo "   ❌ Falha na autenticação. Tente novamente."
  exit 1
fi

