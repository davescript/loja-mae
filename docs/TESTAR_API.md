# 🧪 Como Testar a API

## 🔍 Descobrir a URL do Worker

### Método 1: Via Dashboard Cloudflare (Mais Fácil)

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Workers & Pages**
3. Clique em **loja-mae-api**
4. A URL estará no topo da página, formato:
   ```
   https://loja-mae-api.<seu-subdomain>.workers.dev
   ```

### Método 2: Via Wrangler CLI

```bash
# Listar deployments
npx wrangler deployments list --name loja-mae-api

# Ver informações do Worker
npx wrangler deployments list
```

### Método 3: Via API Cloudflare

```bash
# Obter subdomain da conta
curl -X GET "https://api.cloudflare.com/client/v4/accounts/55b0027975cda6f67a48ea231d2cef8d/workers/subdomain" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"
```

## 🧪 Testar a API

### 1. Health Check

```bash
# Substitua <subdomain> pelo seu subdomain
curl https://loja-mae-api.<subdomain>.workers.dev/api/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-09T07:00:00.000Z"
  }
}
```

### 2. Listar Produtos

```bash
curl https://loja-mae-api.<subdomain>.workers.dev/api/products
```

### 3. Testar Localmente

```bash
# Iniciar servidor local
npm run dev:backend

# Em outro terminal, testar
curl http://localhost:8787/api/health
```

## 🔧 Troubleshooting

### Erro 1042 (Worker não encontrado)
- Verifique se o Worker está deployado
- Verifique se o nome está correto
- Verifique se você está usando o subdomain correto

### Erro CORS
- Verifique se `ALLOWED_ORIGINS` está configurado corretamente
- Verifique se o header `Origin` está sendo enviado

### Erro 401/403
- Verifique se os secrets estão configurados
- Verifique se o token JWT está correto (se aplicável)

## 📋 Endpoints Disponíveis

- `GET /api/health` - Health check
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto (admin)
- `GET /api/categories` - Listar categorias
- `GET /api/orders` - Listar pedidos (autenticado)
- `POST /api/orders` - Criar pedido (autenticado)
- `POST /api/auth/register` - Registrar cliente
- `POST /api/auth/login` - Login cliente
- `POST /api/auth/admin/login` - Login admin
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/stripe/checkout` - Criar checkout Stripe
- `POST /api/stripe/webhook` - Webhook Stripe

## 🔗 Links Úteis

- Cloudflare Dashboard: https://dash.cloudflare.com/
- Workers & Pages: https://dash.cloudflare.com/?to=/:account/workers
- API Docs: https://developers.cloudflare.com/workers/

---

**Nota:** Substitua `<subdomain>` pelo seu subdomain real do Cloudflare Workers.

