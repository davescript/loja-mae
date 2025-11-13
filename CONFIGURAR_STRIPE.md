# 🔧 Configuração do Stripe

Este guia explica como configurar o Stripe no seu e-commerce.

## 📋 Pré-requisitos

1. Conta no Stripe (https://stripe.com)
2. Acesso ao Dashboard do Stripe
3. Cloudflare Workers configurado

## 🔑 Passo 1: Obter as Chaves do Stripe

### 1.1. Acesse o Dashboard do Stripe

1. Acesse https://dashboard.stripe.com
2. Faça login na sua conta

### 1.2. Obter a Chave Secreta (Secret Key)

1. No menu lateral, clique em **"Developers"** → **"API keys"**
2. Na seção **"Secret keys"**, clique em **"Reveal test key"** (para desenvolvimento) ou use a chave **"Live key"** (para produção)
3. Copie a chave (começa com `sk_test_` ou `sk_live_`)

### 1.3. Obter a Chave Pública (Publishable Key)

1. Na mesma página **"API keys"**
2. Na seção **"Publishable keys"**, copie a chave (começa com `pk_test_` ou `pk_live_`)

## 📝 Passo 2: Configurar no Arquivo .dev.vars

Edite o arquivo `.dev.vars` e adicione:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Opcional - será configurado depois
```

## 🚀 Passo 3: Configurar no Cloudflare Workers

### Opção 1: Usando o Script Automático (Recomendado)

```bash
./scripts/configurar-stripe.sh
```

O script irá:
- Ler as variáveis do `.dev.vars`
- Configurar automaticamente no Cloudflare Workers (produção)
- Validar se todas as chaves estão presentes

### Opção 2: Configuração Manual

```bash
# Configurar Secret Key
echo "sua-chave-secreta-aqui" | npx wrangler secret put STRIPE_SECRET_KEY --env production

# Configurar Publishable Key
echo "sua-chave-publica-aqui" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production

# Configurar Webhook Secret (depois de criar o webhook)
echo "seu-webhook-secret-aqui" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
```

## 🔗 Passo 4: Configurar o Webhook do Stripe

### 4.1. Obter a URL do Webhook

1. Deploy o backend no Cloudflare Workers
2. Anote a URL do seu Worker (ex: `https://seu-worker.workers.dev`)
3. A URL do webhook será: `https://seu-worker.workers.dev/api/stripe/webhook`

### 4.2. Criar o Webhook no Stripe

1. No Dashboard do Stripe, vá em **"Developers"** → **"Webhooks"**
2. Clique em **"Add endpoint"**
3. Cole a URL do webhook: `https://seu-worker.workers.dev/api/stripe/webhook`
4. Selecione os eventos para escutar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Clique em **"Add endpoint"**

### 4.3. Obter o Signing Secret

1. Após criar o webhook, clique nele
2. Na seção **"Signing secret"**, clique em **"Reveal"**
3. Copie o secret (começa com `whsec_`)

### 4.4. Adicionar ao .dev.vars e Configurar

1. Adicione ao `.dev.vars`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. Configure no Cloudflare:
   ```bash
   echo "whsec_..." | npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
   ```

   Ou execute o script novamente:
   ```bash
   ./scripts/configurar-stripe.sh
   ```

## ✅ Verificação

### Verificar se as variáveis estão configuradas:

```bash
npx wrangler secret list --env production
```

Você deve ver:
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_PUBLISHABLE_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET` (se configurado)

### Testar o Endpoint de Configuração:

```bash
curl https://seu-worker.workers.dev/api/stripe/config
```

Deve retornar:
```json
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_..."
  }
}
```

## 🧪 Testar o Checkout

1. Acesse o site: `https://www.leiasabores.pt`
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Use um cartão de teste do Stripe:
   - **Número:** `4242 4242 4242 4242`
   - **Data:** Qualquer data futura
   - **CVC:** Qualquer 3 dígitos
   - **CEP:** Qualquer código postal

## 📚 Recursos

- [Documentação do Stripe](https://stripe.com/docs)
- [Cartões de Teste do Stripe](https://stripe.com/docs/testing)
- [Webhooks do Stripe](https://stripe.com/docs/webhooks)

## ⚠️ Importante

- **Nunca** commite o arquivo `.dev.vars` no Git (já está no `.gitignore`)
- Use chaves de **teste** (`sk_test_`, `pk_test_`) para desenvolvimento
- Use chaves de **produção** (`sk_live_`, `pk_live_`) apenas em produção
- Mantenha as chaves secretas seguras e nunca as compartilhe

