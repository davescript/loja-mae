# Guia de Configuração - Loja Mãe

## 🔐 Configuração do Cloudflare

### Problema de Autenticação

Se você está recebendo erros de autenticação ao tentar criar o banco D1, você tem duas opções:

#### Opção 1: Login Interativo (Recomendado)

```bash
# Fazer logout do token atual
unset CLOUDFLARE_API_TOKEN

# Fazer login interativo
npx wrangler login
```

Isso abrirá seu navegador para autenticação via OAuth.

#### Opção 2: Atualizar Token API

1. Vá para: https://dash.cloudflare.com/profile/api-tokens
2. Edite seu token existente ou crie um novo
3. Adicione as seguintes permissões:
   - **Account** → **Cloudflare D1** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **Workers Routes** → **Edit**
   - **User** → **User Details** → **Read**
   - **Zone** → **Zone Settings** → **Read** (se usar rotas customizadas)

4. Configure a variável de ambiente:
```bash
export CLOUDFLARE_API_TOKEN="seu-token-aqui"
```

### Criar Banco D1

Após autenticar corretamente:

```bash
# Criar banco D1
npx wrangler d1 create loja-mae-db

# Copiar o database_id retornado e atualizar no wrangler.toml
# Exemplo: database_id = "abc123def456..."
```

### Criar Bucket R2

```bash
# Criar bucket R2
npx wrangler r2 bucket create loja-mae-images
```

### Configurar Secrets

```bash
# JWT Secret (use uma string aleatória forte)
npx wrangler secret put JWT_SECRET

# Stripe (após criar conta no Stripe)
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# CORS (origens permitidas separadas por vírgula)
npx wrangler secret put ALLOWED_ORIGINS
# Exemplo: http://localhost:5173,https://loja-mae.com
```

### Executar Migrations

```bash
# Aplicar migrations
npm run d1:migrate

# Seed dados iniciais (opcional)
npm run d1:seed
```

## 🚀 Desenvolvimento Local

### Backend

```bash
# Iniciar servidor local do backend
npm run dev:backend
```

Isso iniciará o backend em `http://localhost:8787`

### Frontend

```bash
# Iniciar servidor local do frontend
npm run dev:frontend
```

Isso iniciará o frontend em `http://localhost:5173`

### Ambos

```bash
# Iniciar backend e frontend simultaneamente
npm run dev
```

## 📝 Notas Importantes

### Compatibilidade com Cloudflare Workers

O projeto usa `nodejs_compat` flag no `wrangler.toml` para suportar bibliotecas Node.js como:
- `bcryptjs` - Para hash de senhas
- `jsonwebtoken` - Para tokens JWT

Se encontrar problemas de compatibilidade, você pode:

1. **Usar APIs Web Crypto** (recomendado para produção):
   - Substituir `bcryptjs` por Web Crypto API
   - Substituir `jsonwebtoken` por implementação customizada com Web Crypto

2. **Manter nodejs_compat** (mais fácil, mas pode ter limitações):
   - Funciona bem para desenvolvimento
   - Pode ter overhead de performance em produção

### R2 Public URL

Após configurar seu bucket R2, você precisa:

1. Configurar um domínio público customizado no Cloudflare R2
2. Atualizar a URL no código (`backend/utils/r2.ts`)
3. Ou usar signed URLs temporárias

### Stripe Webhook

Para testar webhooks localmente:

1. Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
2. Fazer login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:8787/api/stripe/webhook`
4. Copiar o webhook secret e usar no `wrangler secret put STRIPE_WEBHOOK_SECRET`

## 🔧 Troubleshooting

### Erro: "D1 database not available"
- Verifique se o `database_id` está correto no `wrangler.toml`
- Verifique se executou `npm run d1:migrate`

### Erro: "R2 bucket not available"
- Verifique se o bucket foi criado: `npx wrangler r2 bucket list`
- Verifique o nome do bucket no `wrangler.toml`

### Erro: "JWT_SECRET not configured"
- Configure o secret: `npx wrangler secret put JWT_SECRET`
- Para desenvolvimento local, você pode adicionar no `.dev.vars`:
```
JWT_SECRET=seu-secret-local
```

### Erro de CORS
- Verifique se `ALLOWED_ORIGINS` está configurado corretamente
- Verifique se a origem do frontend está incluída

## 📚 Recursos

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

