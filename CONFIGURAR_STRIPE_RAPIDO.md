# ⚡ Configuração Rápida do Stripe

Você já atualizou o `.dev.vars` com as chaves do Stripe. Agora precisa configurar no Cloudflare Workers.

## 🚀 Opção 1: Script Automático (Recomendado)

```bash
# 1. Verificar autenticação
npx wrangler whoami

# Se não estiver autenticado:
unset CLOUDFLARE_API_TOKEN
npx wrangler login

# 2. Executar script
./scripts/configurar-stripe.sh
```

## 📝 Opção 2: Configuração Manual

Se o script não funcionar, configure manualmente:

```bash
# 1. Ler as chaves do .dev.vars
source .dev.vars

# 2. Configurar STRIPE_SECRET_KEY
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production

# 3. Configurar STRIPE_PUBLISHABLE_KEY
echo "$STRIPE_PUBLISHABLE_KEY" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production

# 4. Configurar STRIPE_WEBHOOK_SECRET
echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
```

## ✅ Verificar Configuração

```bash
npx wrangler secret list --env production
```

Você deve ver:
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_PUBLISHABLE_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`

## 🔗 Configurar Webhook no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. URL do endpoint: `https://api.leiasabores.pt/api/stripe/webhook`
   - Ou: `https://loja-mae-api.workers.dev/api/stripe/webhook`
4. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copie o **Signing secret** (começa com `whsec_`)
6. Adicione ao `.dev.vars` se ainda não tiver
7. Configure no Cloudflare:
   ```bash
   echo "whsec_..." | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
   ```

## 🧪 Testar

1. Acesse: https://www.leiasabores.pt
2. Adicione produtos ao carrinho
3. Vá para checkout
4. Use cartão de teste: `4242 4242 4242 4242`

## ⚠️ Nota Importante

Vejo que você está usando chaves **LIVE** (`rk_live_`, `pk_live_`). Isso significa que os pagamentos serão reais!

Para desenvolvimento, use chaves de **TESTE** (`sk_test_`, `pk_test_`).

