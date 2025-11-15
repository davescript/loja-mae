# 🚀 Deploy Guide - Loja Mãe

## Deploy Completo em 10 Minutos

### 1️⃣ Pré-requisitos

```bash
# Node.js 18+
node --version

# npm ou pnpm
npm --version

# Wrangler CLI (Cloudflare)
npm install -g wrangler

# Login Cloudflare
wrangler login
```

---

### 2️⃣ Backend (Cloudflare Workers)

#### Criar D1 Database

```bash
# Criar banco
wrangler d1 create loja-mae-db

# Copiar o ID gerado e atualizar wrangler.toml
```

#### Aplicar Migrations

```bash
# Executar todas as migrations
wrangler d1 execute loja-mae-db --remote --file=migrations/0001_init.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0002_favorites.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0003_banners.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0004_analytics.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0005_notifications.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0006_add_shipping_address_id.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0007_order_tracking.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0008_product_reviews.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0009_customer_segments.sql
wrangler d1 execute loja-mae-db --remote --file=migrations/0010_inventory_alerts.sql
```

#### Criar R2 Bucket (Imagens)

```bash
# Criar bucket para imagens
wrangler r2 bucket create loja-mae-images

# Atualizar wrangler.toml com o bucket
```

#### Configurar Secrets

```bash
# JWT Secret (gerar aleatório)
wrangler secret put JWT_SECRET
# Cole uma string aleatória forte

# Stripe Keys
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Email (opcional)
wrangler secret put FROM_EMAIL
wrangler secret put FROM_NAME
```

#### Deploy Worker

```bash
cd backend
npm run build
wrangler deploy
# Anote a URL gerada: https://loja-mae-api.SEU-USUARIO.workers.dev
```

---

### 3️⃣ Frontend (Cloudflare Pages)

#### Configurar Variáveis de Ambiente

Crie `.env.production`:

```bash
VITE_API_BASE_URL=https://loja-mae-api.SEU-USUARIO.workers.dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Build e Deploy

```bash
cd frontend
npm run build

# Deploy via Wrangler Pages
npx wrangler pages deploy dist --project-name=loja-mae

# OU via GitHub (recomendado)
# 1. Push para GitHub
# 2. Conectar repo no Cloudflare Pages dashboard
# 3. Configurar build:
#    - Build command: npm run build
#    - Build output: dist
#    - Environment variables: VITE_API_BASE_URL, etc
```

---

### 4️⃣ Configurações Pós-Deploy

#### CORS no Worker

Atualize `backend/api/router.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'https://loja-mae.pages.dev',
  'https://seu-dominio.com',
];
```

#### Domínio Customizado

**Cloudflare Pages:**
1. Dashboard → Pages → loja-mae → Custom domains
2. Adicionar `www.seu-dominio.com`
3. Configurar DNS (CNAME)

**Cloudflare Workers:**
1. Dashboard → Workers → loja-mae-api → Settings → Triggers
2. Adicionar route: `api.seu-dominio.com/*`
3. Configurar DNS (CNAME ou A record)

---

### 5️⃣ Criar Admin Inicial

```bash
# Via Wrangler console
wrangler d1 execute loja-mae-db --remote --command="
INSERT INTO admins (email, password_hash, role, is_active)
VALUES (
  'admin@seu-dominio.com',
  '\$2a\$10\$HASH_BCRYPT_AQUI',
  'super_admin',
  1
);
"

# Gerar hash bcrypt em: https://bcrypt-generator.com/
# Use 10 rounds
```

---

### 6️⃣ Stripe Webhook

1. Dashboard Stripe → Webhooks → Add endpoint
2. URL: `https://loja-mae-api.SEU-USUARIO.workers.dev/api/stripe/webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copiar Signing Secret e atualizar:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```

---

### 7️⃣ Monitoramento

#### Logs em Tempo Real

```bash
# Worker logs
wrangler tail

# Pages logs
npx wrangler pages deployment tail
```

#### Analytics

- Cloudflare Dashboard → Workers → Analytics
- Cloudflare Dashboard → Pages → Analytics

---

### 8️⃣ Backup e Restore

#### Backup Database

```bash
# Export completo
wrangler d1 export loja-mae-db --remote --output=backup-$(date +%Y%m%d).sql
```

#### Restore

```bash
wrangler d1 execute loja-mae-db --remote --file=backup-20250115.sql
```

---

### 9️⃣ Troubleshooting

#### Worker não responde
```bash
# Verificar logs
wrangler tail

# Redeployar
wrangler deploy --force
```

#### CORS error
- Verificar ALLOWED_ORIGINS no router.ts
- Verificar se frontend está usando URL correta

#### Database error
```bash
# Verificar conexão
wrangler d1 execute loja-mae-db --remote --command="SELECT 1"

# Listar tabelas
wrangler d1 execute loja-mae-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

#### Stripe webhook falha
- Verificar Signing Secret
- Verificar logs: `wrangler tail`
- Testar via Stripe CLI: `stripe listen --forward-to localhost:8787/api/stripe/webhook`

---

### 🔟 Performance Tips

#### Enable Cache

```typescript
// Em router.ts, adicionar headers:
'Cache-Control': 'public, max-age=3600' // 1 hora
```

#### Optimize Images

- Usar Cloudflare Images ou Image Resizing
- Converter para WebP
- Lazy loading

#### Enable HTTP/3

Cloudflare Dashboard → Speed → Optimization → HTTP/3: ON

---

## 🎉 Deploy Completo!

Seu ecommerce está rodando em:
- **Frontend**: https://loja-mae.pages.dev
- **API**: https://loja-mae-api.SEU-USUARIO.workers.dev
- **Admin**: https://loja-mae.pages.dev/admin

### Próximos Passos

1. Adicionar produtos via admin
2. Configurar Stripe em produção
3. Testar fluxo completo de compra
4. Configurar domínio customizado
5. Ativar analytics
6. Monitorar logs

**Sistema pronto para receber pedidos! 🚀**
