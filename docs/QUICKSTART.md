# 🚀 Quick Start - Loja Mãe

## ⚠️ Problema de Autenticação Cloudflare

Se você recebeu o erro:
```
✘ [ERROR] A request to the Cloudflare API (/memberships) failed.
Authentication error [code: 10000]
```

### Solução Rápida:

1. **Remover o token API atual** (se estiver usando):
```bash
unset CLOUDFLARE_API_TOKEN
```

2. **Fazer login interativo**:
```bash
npx wrangler login
```
Isso abrirá seu navegador para autenticação OAuth. É o método mais simples e recomendado.

3. **Verificar autenticação**:
```bash
npx wrangler whoami
```

4. **Criar banco D1**:
```bash
npx wrangler d1 create loja-mae-db
```

5. **Copiar o database_id** retornado e atualizar no `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "loja-mae-db"
database_id = "cole-o-id-aqui"
```

## 📋 Setup Completo

### Opção 1: Script Automatizado

```bash
npm run setup
```

### Opção 2: Manual

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar Cloudflare** (após login):
```bash
# Criar banco D1
npx wrangler d1 create loja-mae-db

# Criar bucket R2
npx wrangler r2 bucket create loja-mae-images

# Atualizar database_id no wrangler.toml
```

3. **Configurar variáveis de ambiente**:
```bash
# Copiar exemplo
cp .dev.vars.example .dev.vars

# Editar .dev.vars com suas chaves
```

4. **Executar migrations**:
```bash
# Produção
npm run d1:migrate

# Local (desenvolvimento)
npm run d1:migrate:local
```

5. **Configurar secrets** (opcional para produção):
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ALLOWED_ORIGINS
```

## 🏃 Executar

### Desenvolvimento

```bash
# Backend e frontend juntos
npm run dev

# Ou separadamente:
npm run dev:backend  # http://localhost:8787
npm run dev:frontend # http://localhost:5173
```

### Produção

```bash
npm run build
npm run deploy
```

## 🔑 Gerar Hash de Senha para Admin

Para criar um admin no banco, você precisa gerar um hash bcrypt da senha:

```bash
# Usando Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"
```

Ou use uma ferramenta online: https://bcrypt-generator.com/

## 📝 Notas

- Para desenvolvimento local, use `.dev.vars` (não commitado)
- Para produção, use `wrangler secret put`
- O banco D1 local é separado do remoto
- Use `--local` flag para comandos de desenvolvimento local

## 🆘 Problemas Comuns

### "D1 database not available"
- Verifique se o `database_id` está correto no `wrangler.toml`
- Execute `npm run d1:migrate:local` para desenvolvimento local

### "JWT_SECRET not configured"
- Crie `.dev.vars` com `JWT_SECRET=seu-secret-aqui`
- Ou configure via `wrangler secret put JWT_SECRET`

### "R2 bucket not available"
- Verifique se o bucket foi criado
- Verifique o nome no `wrangler.toml`

### Erro de CORS
- Verifique `ALLOWED_ORIGINS` no `.dev.vars` ou secrets
- Adicione a origem do frontend (ex: `http://localhost:5173`)

## 📚 Mais Informações

Veja `SETUP.md` para documentação completa.

