# ✅ Verificação de Configuração - Frontend Pages

## 📋 Checklist de Verificação

### ✅ 1. Estrutura do Projeto
- [x] Diretório `frontend/` existe
- [x] Diretório `backend/` existe
- [x] Arquivo `package.json` configurado
- [x] Arquivo `vite.config.ts` configurado
- [x] Arquivo `wrangler.toml` para backend

### ✅ 2. Build do Frontend
- [x] Comando `npm run build:frontend` funciona
- [x] Gera diretório `dist/` com assets
- [x] Build sem erros

### ✅ 3. Workflow GitHub Actions
- [x] Workflow `.github/workflows/deploy-frontend.yml` existe
- [x] Usa `cloudflare/pages-action@v1`
- [x] Configurado para deploy no Pages
- [x] Build command: `npm run build:frontend`
- [x] Output directory: `dist`
- [x] Project name: `loja-mae-frontend`

### ✅ 4. Variáveis de Ambiente
- [x] `VITE_API_BASE_URL` configurado no workflow
- [x] `VITE_STRIPE_PUBLISHABLE_KEY` configurado no workflow
- [x] Valores padrão configurados
- [x] Pode ser sobrescrito via secrets do GitHub

### ✅ 5. Configuração do Backend
- [x] API deployada: `https://loja-mae-api.davecdl.workers.dev`
- [x] Rota customizada: `api.leiasabores.pt`
- [x] ALLOWED_ORIGINS configurado
- [x] CORS habilitado

### ✅ 6. Documentação
- [x] `DEPLOY_FRONTEND.md` criado
- [x] `LIMPAR_WORKERS.md` criado
- [x] `TESTAR_API.md` criado
- [x] Scripts de deploy criados

## 🔧 Próximos Passos

### 1. Criar Projeto no Cloudflare Pages

1. Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
2. Clique em **"Create a project"**
3. Escolha **"Connect to Git"**
4. Configure:
   - **Nome**: `loja-mae-frontend`
   - **Repositório**: `davescript/loja-mae`
   - **Branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build:frontend`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (deixe vazio)

### 2. Configurar Variáveis de Ambiente

No Cloudflare Pages, configure:
- `VITE_API_BASE_URL`: `https://api.leiasabores.pt`
- `VITE_STRIPE_PUBLISHABLE_KEY`: (sua chave Stripe)

### 3. Configurar Domínio Customizado

1. No projeto Pages, vá em **"Custom domains"**
2. Adicione:
   - `leiasabores.pt`
   - `www.leiasabores.pt`

### 4. Configurar DNS

Para o domínio customizado:
- **Type**: CNAME
- **Name**: `@` (ou `www`)
- **Target**: `loja-mae-frontend.pages.dev`
- **Proxy**: ✅ Proxied

## ✅ Status Atual

### Backend (Workers)
- ✅ Worker: `loja-mae-api`
- ✅ URL: `https://loja-mae-api.davecdl.workers.dev`
- ✅ Custom: `https://api.leiasabores.pt` (após DNS)
- ✅ Status: Funcionando

### Frontend (Pages)
- ⏭️ Projeto: `loja-mae-frontend` (criar no Pages)
- ⏭️ URL: `https://loja-mae-frontend.pages.dev` (após criar)
- ⏭️ Custom: `https://leiasabores.pt` (após configurar)
- ✅ Configuração: Pronta

### Workers a Limpar
- ❌ `loja-mae-api-production` - Apagar
- ❌ `loja-mae-db` - Apagar
- ⚠️ `loja-mae-frontend` - Apagar (será usado Pages)

## 🧪 Testes

### Backend
```bash
# Health check
curl https://loja-mae-api.davecdl.workers.dev/api/health

# Root
curl https://loja-mae-api.davecdl.workers.dev/
```

### Frontend (após deploy)
```bash
# Verificar se está no ar
curl https://loja-mae-frontend.pages.dev

# Verificar se API está acessível
# (testar no navegador)
```

## 📋 Checklist Final

- [x] Backend configurado e deployado
- [x] Frontend build funcionando
- [x] Workflow GitHub Actions configurado
- [x] Documentação criada
- [ ] Projeto Pages criado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio customizado configurado
- [ ] DNS configurado
- [ ] Primeiro deploy realizado
- [ ] Testes realizados

## 🔗 Links Úteis

- Cloudflare Pages: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
- Workers: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/workers
- DNS: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/leiasabores.pt/dns/records
- GitHub Actions: https://github.com/davescript/loja-mae/actions

---

**Status**: ✅ Configuração completa e pronta para deploy
**Próximo passo**: Criar projeto no Cloudflare Pages

