# 🚀 Solução para Deploy

## Problema
O token de autenticação do Cloudflare está inválido ou expirado.

## Soluções

### ✅ Opção 1: Login via OAuth (Mais Fácil)

```bash
# 1. Remover tokens antigos
unset CLOUDFLARE_API_TOKEN
unset CF_API_TOKEN

# 2. Fazer login interativo
npx wrangler login

# 3. Verificar autenticação
npx wrangler whoami

# 4. Fazer deploy
npm run deploy:backend
```

### ✅ Opção 2: Deploy via GitHub Actions

Se você tem o repositório configurado com GitHub Actions:

```bash
# 1. Adicionar mudanças
git add .

# 2. Commit
git commit -m "Fix: Corrigir erros TypeScript e atualizar deploy"

# 3. Push
git push origin main

# O GitHub Actions fará o deploy automaticamente
```

### ✅ Opção 3: Criar Novo API Token

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em "Create Token"
3. Use o template "Edit Cloudflare Workers"
4. Adicione permissões:
   - Workers:Edit
   - Account:Read
   - D1:Edit
   - R2:Edit
5. Copie o token
6. Configure:
   ```bash
   export CLOUDFLARE_API_TOKEN="seu-token-aqui"
   npm run deploy:backend
   ```

## Verificar Deploy

Após o deploy, verifique:

```bash
# Ver logs
npx wrangler tail --env production

# Ver informações do Worker
npx wrangler deployments list --env production
```

