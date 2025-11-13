#!/bin/bash

# Script para forçar login via OAuth removendo qualquer token

echo "🔧 Forçando remoção de token e login via OAuth..."
echo ""

# Remover de todos os lugares possíveis
echo "1️⃣  Removendo token da sessão atual..."
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

echo "2️⃣  Verificando arquivos de configuração..."
CONFIG_FILES=(
  "$HOME/.zshrc"
  "$HOME/.zshenv"
  "$HOME/.zprofile"
  "$HOME/.bashrc"
  "$HOME/.bash_profile"
  "$HOME/.profile"
)

for file in "${CONFIG_FILES[@]}"; do
  if [ -f "$file" ] && grep -q "CLOUDFLARE_API_TOKEN" "$file" 2>/dev/null; then
    echo "   ⚠️  Encontrado em: $file"
    sed -i.bak '/CLOUDFLARE_API_TOKEN/d' "$file"
    echo "   ✅ Removido (backup: ${file}.bak)"
  fi
done

echo ""
echo "3️⃣  Limpando cache do Wrangler..."
rm -rf ~/.wrangler/config/default.toml 2>/dev/null || true
rm -rf ~/.wrangler/config/default.json 2>/dev/null || true

echo ""
echo "4️⃣  Verificando se token foi removido..."
if env | grep -q "CLOUDFLARE_API_TOKEN"; then
  echo "   ⚠️  Token ainda presente! Pode estar em outro lugar."
  echo "   Tente fechar e reabrir o terminal."
else
  echo "   ✅ Token não encontrado - OK!"
fi

echo ""
echo "5️⃣  Fazendo login via OAuth..."
echo "   (Isso abrirá seu navegador)"
echo ""
npx wrangler login

echo ""
echo "6️⃣  Verificando autenticação..."
if npx wrangler whoami > /dev/null 2>&1; then
  echo "   ✅ Login bem-sucedido!"
  echo ""
  echo "📧 Agora configure os secrets:"
  echo "   ./scripts/configurar-email-valores.sh"
else
  echo "   ❌ Falha no login."
  echo ""
  echo "   Tente:"
  echo "   1. Fechar e reabrir o terminal"
  echo "   2. Executar: unset CLOUDFLARE_API_TOKEN"
  echo "   3. Executar: npx wrangler login"
  exit 1
fi

