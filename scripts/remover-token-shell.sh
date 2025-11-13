#!/bin/bash

# Script para remover CLOUDFLARE_API_TOKEN de arquivos de configuração do shell

echo "🔍 Procurando CLOUDFLARE_API_TOKEN em arquivos de configuração..."
echo ""

FILES=(
  "$HOME/.zshrc"
  "$HOME/.zprofile"
  "$HOME/.zshenv"
  "$HOME/.bashrc"
  "$HOME/.bash_profile"
)

FOUND=false

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "CLOUDFLARE_API_TOKEN" "$file"; then
      echo "⚠️  Encontrado em: $file"
      echo ""
      echo "Linhas encontradas:"
      grep -n "CLOUDFLARE_API_TOKEN" "$file"
      echo ""
      read -p "Deseja remover essas linhas? (s/n) " -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Criar backup
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        # Remover linhas com CLOUDFLARE_API_TOKEN
        sed -i '' '/CLOUDFLARE_API_TOKEN/d' "$file"
        echo "✅ Removido de $file"
        echo "📦 Backup criado: ${file}.backup.$(date +%Y%m%d_%H%M%S)"
        FOUND=true
      fi
    fi
  fi
done

if [ "$FOUND" = false ]; then
  echo "✅ Nenhum CLOUDFLARE_API_TOKEN encontrado em arquivos de configuração"
fi

echo ""
echo "🔄 Removendo da sessão atual..."
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

echo ""
echo "✅ Token removido da sessão atual"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Feche e reabra o terminal para aplicar mudanças"
echo "   - Ou execute: source ~/.zshrc"
echo ""
echo "🔑 Para deploy local, use: npx wrangler login (OAuth)"
echo "🔐 Para GitHub Actions, use token como secret (já configurado)"

