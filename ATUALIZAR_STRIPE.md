# 🔐 Atualizar Secrets do Stripe

## ✅ Solução Rápida

Execute o script que força OAuth e atualiza todos os secrets:

```bash
./scripts/atualizar-stripe-forcado.sh
```

## 📋 O que o script faz:

1. Remove token antigo completamente
2. Faz logout
3. Limpa cache
4. Faz login via OAuth
5. Atualiza os 3 secrets do Stripe:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

## 🔍 Verificar se funcionou

```bash
npx wrangler secret list --env production | grep -i stripe
```

Deve mostrar:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## ⚠️ Se ainda der erro

1. **Feche e reabra o terminal** (importante!)
2. Execute novamente: `./scripts/atualizar-stripe-forcado.sh`
3. Ou use o Dashboard do Cloudflare:
   - https://dash.cloudflare.com/
   - Workers & Pages → loja-mae-api → Settings → Variables
   - Adicione/atualize os secrets manualmente

## 🧪 Testar após atualizar

```bash
# Testar endpoint de configuração
curl https://api.leiasabores.pt/api/stripe/config

# Deve retornar a publishable key
```

