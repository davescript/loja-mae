# ⚡ Execute Agora - Configurar Stripe

Você já tem as chaves no `.dev.vars`. Agora execute estes comandos:

## 🔐 1. Autenticar no Wrangler (se necessário)

```bash
unset CLOUDFLARE_API_TOKEN
npx wrangler login
```

## 📝 2. Ver os Comandos Prontos

Execute este script para ver os comandos com suas chaves:

```bash
./scripts/configurar-stripe-comandos.sh
```

Ou configure manualmente:

## 📝 3. Configurar Manualmente

```bash
# Carregar variáveis do .dev.vars
source .dev.vars

# Configurar STRIPE_SECRET_KEY
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production

# Configurar STRIPE_PUBLISHABLE_KEY
echo "$STRIPE_PUBLISHABLE_KEY" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production

# Configurar STRIPE_WEBHOOK_SECRET
echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
```

## ✅ 4. Verificar

```bash
npx wrangler secret list --env production
```

Você deve ver as 3 variáveis listadas.

## 🚀 5. Deploy (se necessário)

```bash
npm run deploy:backend
```

## 🧪 6. Testar

1. Acesse: https://www.leiasabores.pt
2. Adicione produtos ao carrinho
3. Vá para checkout
4. O checkout deve carregar sem erros!

