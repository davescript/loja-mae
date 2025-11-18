# 🚀 Configurar Cloudflare Pages - Guia Rápido

## ✅ Projeto já criado no Pages

Agora vamos configurar e testar o deploy.

## 📋 1. Verificar Configuração do Projeto

No Cloudflare Pages, verifique:

### Build Settings
- **Production branch**: `main`
- **Framework preset**: `Vite` (ou `None` se não disponível)
- **Build command**: `npm run build:frontend`
- **Build output directory**: `dist`
- **Root directory**: `/` (deixe vazio ou `/`)

### Variáveis de Ambiente

Configure as seguintes variáveis no projeto Pages:

1. Acesse o projeto no Pages
2. Vá em **Settings** → **Environment variables**
3. Adicione:

```env
VITE_API_BASE_URL=https://api.leiasabores.pt
# Ou use workers.dev temporariamente:
# VITE_API_BASE_URL=https://loja-mae-api.davecdl.workers.dev

VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Sua chave Stripe publishable
```

**Importante**: Configure para **Production**, **Preview** e **Branch deploys**.

## 📋 2. Configurar Domínio Customizado

### No Cloudflare Pages:

1. Vá em **Custom domains**
2. Clique em **Set up a custom domain**
3. Adicione:
   - `leiasabores.pt`
   - `www.leiasabores.pt`

### Configurar DNS:

No Cloudflare DNS (leiasabores.pt), adicione:

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | @ | loja-mae-frontend.pages.dev | ✅ | Auto |
| CNAME | www | loja-mae-frontend.pages.dev | ✅ | Auto |

**Nota**: O Cloudflare Pages usa CNAME, não IPs.

## 📋 3. Testar Deploy

### Opção A: Deploy Automático (GitHub Actions)

O workflow já está configurado. Faça um push:

```bash
# Fazer uma pequena mudança para trigger
git commit --allow-empty -m "Trigger frontend deployment"
git push
```

### Opção B: Deploy Manual

```bash
# Build
npm run build:frontend

# Deploy via Wrangler
npx wrangler pages deploy dist --project-name=loja-mae-frontend
```

## 📋 4. Verificar Deploy

Após o deploy, verifique:

1. **URL do Pages**: `https://loja-mae-frontend.pages.dev`
2. **Console do navegador**: Verifique se há erros
3. **Network tab**: Verifique se a API está sendo chamada corretamente
4. **Variáveis de ambiente**: Verifique se estão sendo usadas

## 🧪 Testar Localmente com Variáveis de Produção

```bash
# Definir variáveis
export VITE_API_BASE_URL=https://api.leiasabores.pt
export VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Build
npm run build:frontend

# Preview
npm run preview
# ou
npx vite preview
```

## 🔧 Troubleshooting

### Erro: "API not found"
- Verifique se `VITE_API_BASE_URL` está correto
- Verifique se a API está funcionando: `curl https://api.leiasabores.pt/api/health`
- Verifique CORS na API

### Erro: "Build failed"
- Verifique os logs no Cloudflare Pages
- Teste localmente: `npm run build:frontend`
- Verifique se todas as dependências estão no `package.json`

### Erro: "Domain not found"
- Verifique se o DNS está configurado corretamente
- Aguarde propagação DNS (pode levar alguns minutos)
- Verifique se o domínio está no Cloudflare

### Variáveis de ambiente não funcionam
- Verifique se estão configuradas para o ambiente correto (Production/Preview)
- Verifique se o nome da variável está correto (`VITE_` prefix)
- Faça um novo deploy após configurar variáveis

## 📋 Checklist Final

- [x] Projeto criado no Pages
- [ ] Build settings configurados
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio customizado configurado (opcional)
- [ ] DNS configurado (opcional)
- [ ] Primeiro deploy realizado
- [ ] Testes realizados
- [ ] Console sem erros
- [ ] API conectada corretamente

## 🔗 Links Úteis

- Cloudflare Pages: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
- Projeto: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages/view/loja-mae-frontend
- GitHub Actions: https://github.com/davescript/loja-mae/actions
- API: https://api.leiasabores.pt

---

**Status**: ⏭️ Configure variáveis de ambiente e teste o deploy

