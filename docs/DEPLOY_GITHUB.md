# 🚀 Deploy para GitHub - Loja Mãe

## 📋 Passos para Fazer Deploy no GitHub

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `loja-mãe` ou `loja-mae`
3. Escolha se será público ou privado
4. **NÃO** inicialize com README, .gitignore ou license (já temos)
5. Clique em "Create repository"

### 2. Conectar Repositório Local ao GitHub

```bash
# Adicionar remote (substitua USERNAME pelo seu usuário GitHub)
git remote add origin https://github.com/USERNAME/loja-mae.git

# Ou usando SSH (se tiver configurado)
git remote add origin git@github.com:USERNAME/loja-mae.git

# Verificar remote
git remote -v
```

### 3. Fazer Push do Código

```bash
# Fazer push para o branch main
git branch -M main
git push -u origin main
```

### 4. Configurar Secrets no GitHub (para CI/CD)

Para usar o GitHub Actions para deploy automático:

1. Acesse: https://github.com/USERNAME/loja-mae/settings/secrets/actions
2. Adicione os seguintes secrets:
   - `CLOUDFLARE_API_TOKEN` - Token API do Cloudflare
   - `CLOUDFLARE_ACCOUNT_ID` - ID da conta Cloudflare (encontre em: https://dash.cloudflare.com/)

**Como obter o Account ID:**
```bash
npx wrangler whoami
# Ou no dashboard do Cloudflare: Settings → Account ID
```

### 5. Verificar Deploy Automático

Após fazer push, o GitHub Actions irá:
- Instalar dependências
- Fazer deploy automático para Cloudflare Workers
- Você pode ver o progresso em: https://github.com/USERNAME/loja-mae/actions

## 🔐 Secrets do GitHub Actions

Os secrets necessários são:

1. **CLOUDFLARE_API_TOKEN**
   - Crie em: https://dash.cloudflare.com/profile/api-tokens
   - Permissões necessárias:
     - Account → Cloudflare Workers → Edit
     - Account → Account Settings → Read
     - Zone → Zone Settings → Read (se usar rotas customizadas)

2. **CLOUDFLARE_ACCOUNT_ID**
   - Encontre em: https://dash.cloudflare.com/
   - Ou execute: `npx wrangler whoami`

## 📝 Estrutura dos Workflows

### Deploy Backend (`.github/workflows/deploy.yml`)
- Deploy automático do backend para Cloudflare Workers
- Executa em push para `main` ou `master`
- Usa Wrangler Action oficial do Cloudflare

### Deploy Frontend (`.github/workflows/deploy-frontend.yml`)
- Build do frontend
- Prepara artefatos para deploy
- Pode ser integrado com Vercel/Netlify/Cloudflare Pages

## 🔄 Deploy Manual

Se preferir fazer deploy manual:

```bash
# Deploy do backend
npm run deploy:backend

# Build do frontend
npm run build:frontend
```

## ⚠️ Importante

1. **Nunca commite secrets**: O arquivo `.dev.vars` está no `.gitignore` e não será commitado
2. **Secrets no GitHub**: Configure os secrets no GitHub Actions, não no código
3. **Branch Protection**: Considere proteger o branch `main` no GitHub
4. **Review de Código**: Configure pull requests para revisão antes de merge

## 📚 Comandos Úteis

### Ver status do Git:
```bash
git status
```

### Ver commits:
```bash
git log --oneline
```

### Fazer push de um novo branch:
```bash
git checkout -b feature/nova-feature
git add .
git commit -m "Descrição da feature"
git push -u origin feature/nova-feature
```

### Atualizar código local:
```bash
git pull origin main
```

## 🆘 Troubleshooting

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/loja-mae.git
```

### Erro: "Authentication failed"
- Verifique suas credenciais do GitHub
- Use SSH em vez de HTTPS se tiver problemas
- Configure um Personal Access Token: https://github.com/settings/tokens

### Erro no GitHub Actions
- Verifique se os secrets estão configurados corretamente
- Verifique os logs do workflow em: Actions → Workflow run
- Verifique se o token API tem as permissões corretas

## 📞 Próximos Passos

Após fazer push para o GitHub:

1. ✅ Código no GitHub
2. ✅ CI/CD configurado (opcional)
3. ⏭️ Deploy do backend (manual ou automático)
4. ⏭️ Deploy do frontend (Vercel/Netlify/Cloudflare Pages)
5. ⏭️ Configurar domínio customizado
6. ⏭️ Configurar webhook Stripe

