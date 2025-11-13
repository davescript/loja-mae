#!/bin/bash

# Wrapper seguro para comandos wrangler que sempre remove token antigo

# Remover token antes de executar
unset CLOUDFLARE_API_TOKEN
export -n CLOUDFLARE_API_TOKEN 2>/dev/null || true

# Executar comando wrangler
npx wrangler "$@"

