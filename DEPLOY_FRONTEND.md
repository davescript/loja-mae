# 🚀 Deploy do Frontend no Cloudflare Pages

## 📋 Configuração

### 1. Criar Projeto no Cloudflare Pages

#### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
2. Clique em **"Create a project"**
3. Selecione **"Connect to Git"**
4. Escolha o repositório: `davescript/loja-mae`
5. Configure o projeto:
   - **Project name**: `loja-mae-frontend`
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build:frontend`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (deixe vazio)

6. **Variáveis de Ambiente**:
   - `VITE_API_BASE_URL`: `https://api.leiasabores.pt` (ou `https://loja-mae-api.davecdl.workers.dev`)
   - `VITE_STRIPE_PUBLISHABLE_KEY`: (sua chave Stripe publishable)

7. Clique em **"Save and Deploy"**

#### Opção B: Via GitHub Actions (Automático)

O workflow `.github/workflows/deploy-frontend.yml` já está configurado para fazer deploy automático quando houver mudanças no frontend.

### 2. Configurar Domínio Customizado

1. No projeto Pages, vá em **"Custom domains"**
2. Clique em **"Set up a custom domain"**
3. Adicione:
   - `leiasabores.pt`
   - `www.leiasabores.pt`

4. Configure DNS records no Cloudflare:
   - **Type**: CNAME
   - **Name**: `@` (ou `www`)
   - **Target**: `loja-mae-frontend.pages.dev`
   - **Proxy status**: ✅ Proxied
   - **TTL**: Auto

### 3. Variáveis de Ambiente

Configure no Cloudflare Pages:

```env
VITE_API_BASE_URL=https://api.leiasabores.pt
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Ou via GitHub Actions secrets:
- `VITE_API_BASE_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 4. Deploy Manual (Opcional)

```bash
# Build do frontend
npm run build:frontend

# Deploy via Wrangler Pages
npx wrangler pages deploy dist --project-name=loja-mae-frontend
```

## 🔧 Configuração do GitHub Actions

O workflow `.github/workflows/deploy-frontend.yml` faz deploy automático quando:
- Há mudanças em `frontend/**`
- Há mudanças em arquivos de configuração (`package.json`, `vite.config.ts`, etc.)
- Push para `main` ou `master`

### Secrets Necessários

Configure no GitHub:
- `CLOUDFLARE_API_TOKEN` (já configurado)
- `CLOUDFLARE_ACCOUNT_ID` (já configurado)
- `VITE_API_BASE_URL` (opcional - padrão: workers.dev)
- `VITE_STRIPE_PUBLISHABLE_KEY` (opcional)

## 📋 Estrutura do Projeto

```
loja-mae/
├── frontend/           # Código do frontend
├── dist/              # Build output (gerado)
├── package.json
├── vite.config.ts
└── .github/workflows/
    └── deploy-frontend.yml
```

## 🧪 Testar Localmente

```bash
# Desenvolvimento
npm run dev:frontend

# Build
npm run build:frontend

# Preview do build
npm run preview
```

## 🔗 URLs

- **Pages Dev**: `https://loja-mae-frontend.pages.dev`
- **Custom Domain**: `https://leiasabores.pt` (após configurar)
- **Custom Domain (www)**: `https://www.leiasabores.pt` (após configurar)

## ✅ Checklist

- [ ] Projeto Pages criado
- [ ] Repositório conectado
- [ ] Build command configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio customizado configurado (opcional)
- [ ] DNS records configurados (opcional)
- [ ] Primeiro deploy realizado
- [ ] Testes realizados

## 🆘 Troubleshooting

### Erro: "Build failed"
- Verifique se `npm run build:frontend` funciona localmente
- Verifique os logs no Cloudflare Pages
- Verifique se as variáveis de ambiente estão configuradas

### Erro: "API not found"
- Verifique se `VITE_API_BASE_URL` está correto
- Verifique se a API está funcionando
- Verifique CORS na API

### Erro: "Domain not found"
- Verifique se o DNS record está configurado
- Verifique se o domínio está no Cloudflare
- Aguarde propagação DNS (pode levar alguns minutos)

## 📚 Referências

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Pages Deployment](https://developers.cloudflare.com/pages/platform/deploy-hooks/)
- [Custom Domains](https://developers.cloudflare.com/pages/how-to/custom-branches/)

---

**Status**: ⏭️ Configure o projeto no Cloudflare Pages

