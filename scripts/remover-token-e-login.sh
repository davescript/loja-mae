#!/bin/bash

# Script para remover token de API e fazer login via OAuth

echo "🔍 Procurando token de API configurado..."
echo ""

# Verificar arquivos de configuração
FILES_TO_CHECK=(
  "$HOME/.zshrc"
  "$HOME/.bashrc"
  "$HOME/.bash_profile"
  "$HOME/.profile"
  "$HOME/.zshenv"
  "$HOME/.zprofile"
)

FOUND=false

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ] && grep -q "CLOUDFLARE_API_TOKEN" "$file" 2>/dev/null; then
    echo "✅ Encontrado em: $file"
    FOUND=true
    echo ""
    echo "Linha encontrada:"
    grep "CLOUDFLARE_API_TOKEN" "$file"
    echo ""
    read -p "Deseja remover esta linha? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      # Remover a linha (comentada ou não)
      sed -i.bak '/CLOUDFLARE_API_TOKEN/d' "$file"
      echo "✅ Linha removida de $file"
      echo "   (Backup criado: ${file}.bak)"
    fi
  fi
done

# Remover da sessão atual
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo ""
  echo "✅ Removendo token da sessão atual..."
  unset CLOUDFLARE_API_TOKEN
fi

if [ "$FOUND" = false ] && [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Token não encontrado em arquivos de configuração."
  echo "   Pode estar em outro lugar ou já foi removido."
  echo ""
fi

echo ""
echo "🔄 Recarregando configuração do shell..."
if [ -f ~/.zshrc ]; then
  source ~/.zshrc 2>/dev/null || true
elif [ -f ~/.bashrc ]; then
  source ~/.bashrc 2>/dev/null || true
fi

echo ""
echo "🔐 Fazendo login via OAuth..."
echo "   (Isso abrirá seu navegador)"
echo ""
npx wrangler login

echo ""
echo "✅ Verificando autenticação..."
if npx wrangler whoami > /dev/null 2>&1; then
  echo "   ✅ Login bem-sucedido!"
  echo ""
  echo "📧 Agora você pode configurar os secrets:"
  echo "   ./scripts/configurar-email-valores.sh"
else
  echo "   ❌ Falha no login. Tente novamente."
  exit 1
fi

