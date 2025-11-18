# 🌐 Configurar Domínio Customizado

## 📋 Configuração do Domínio `leiasabores.pt`

### 1. Configurar DNS Record no Cloudflare

1. Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/leiasabores.pt/dns/records

2. Adicione um registro CNAME:
   - **Type**: CNAME
   - **Name**: `api`
   - **Target**: `loja-mae-api.davecdl.workers.dev`
   - **Proxy status**: Proxied (nuvem laranja) ✅
   - **TTL**: Auto

3. Ou use um registro A (se preferir):
   - **Type**: A
   - **Name**: `api`
   - **IPv4 address**: `192.0.2.0` (endereço de documentação - Cloudflare reconhece quando proxied)
   - **Proxy status**: Proxied (nuvem laranja) ✅
   - **TTL**: Auto

### 2. Deploy com Rota Customizada

Após configurar o DNS, faça o deploy:

```bash
npx wrangler deploy --env production
```

Ou use o GitHub Actions (já configurado).

### 3. Atualizar ALLOWED_ORIGINS

Atualize o secret `ALLOWED_ORIGINS` para incluir os novos domínios:

```bash
# Para produção
echo "https://leiasabores.pt,https://www.leiasabores.pt,https://api.leiasabores.pt,http://localhost:5173" | npx wrangler secret put ALLOWED_ORIGINS --name loja-mae-api --env production
```

### 4. Verificar Configuração

Após o deploy, teste:

```bash
# Testar API no domínio customizado
curl https://api.leiasabores.pt/api/health

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "status": "ok",
#     "timestamp": "..."
#   }
# }
```

## 📋 Configuração do Frontend

### Opção 1: Cloudflare Pages (Recomendado)

1. **Build do Frontend:**
   ```bash
   npm run build:frontend
   ```

2. **Deploy via Dashboard:**
   - Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
   - Clique em "Create a project"
   - Conecte ao repositório GitHub: `davescript/loja-mae`
   - Configure:
     - **Framework preset**: Vite
     - **Build command**: `npm run build:frontend`
     - **Build output directory**: `dist`
     - **Root directory**: `/`

3. **Variáveis de Ambiente:**
   - `VITE_API_BASE_URL`: `https://api.leiasabores.pt`
   - `VITE_STRIPE_PUBLISHABLE_KEY`: (sua chave Stripe)

4. **Domínio Customizado:**
   - No projeto Pages, vá em "Custom domains"
   - Adicione: `leiasabores.pt` e `www.leiasabores.pt`

### Opção 2: Deploy Manual

```bash
# Build
npm run build:frontend

# Deploy via Wrangler Pages
npx wrangler pages deploy dist --project-name=loja-mae-frontend
```

## 🔧 Configuração Completa

### DNS Records Necessários

| Type | Name | Target/Content | Proxy | TTL |
|------|------|----------------|-------|-----|
| CNAME | api | loja-mae-api.davecdl.workers.dev | ✅ | Auto |
| A | @ | (seu IP do servidor) | ✅ | Auto |
| CNAME | www | leiasabores.pt | ✅ | Auto |

### URLs Finais

- **API**: https://api.leiasabores.pt
- **Frontend**: https://leiasabores.pt
- **Frontend (www)**: https://www.leiasabores.pt

## ✅ Checklist

- [ ] DNS record `api.leiasabores.pt` configurado
- [ ] Deploy do Worker com rota customizada
- [ ] ALLOWED_ORIGINS atualizado
- [ ] Frontend deployado
- [ ] Variáveis de ambiente do frontend configuradas
- [ ] Domínio customizado do frontend configurado
- [ ] SSL/TLS ativado (automático no Cloudflare)
- [ ] Testes realizados

## 🔗 Links Úteis

- Cloudflare Dashboard: https://dash.cloudflare.com/
- DNS Records: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/leiasabores.pt/dns/records
- Workers & Pages: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/workers
- Pages: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages

---

**Status**: ⏭️ Configure o DNS record primeiro, depois faça o deploy

