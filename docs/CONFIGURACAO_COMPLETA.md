# ✅ Configuração Completa - Loja Mãe

## 🎉 Status da Configuração

### ✅ Secrets Configurados no Cloudflare:
- ✅ **JWT_SECRET** - Configurado
- ✅ **STRIPE_SECRET_KEY** - Configurado (chave LIVE)
- ✅ **STRIPE_WEBHOOK_SECRET** - Configurado
- ✅ **ALLOWED_ORIGINS** - Configurado (localhost para dev)

### ✅ Infraestrutura:
- ✅ **D1 Database** - Criado e configurado
  - Nome: `loja-mae-db`
  - ID: `9815d658-ce3b-4b8a-be98-90563c950182`
  - Migrations aplicadas (17 tabelas criadas)
  
- ✅ **R2 Bucket** - Criado
  - Nome: `loja-mae-images`
  - Pronto para upload de imagens

### ✅ Código:
- ✅ Backend compilando sem erros
- ✅ Rotas API configuradas
- ✅ Módulos de negócio implementados
- ✅ Validação com Zod
- ✅ Autenticação JWT
- ✅ Integração Stripe

## 🚀 Próximos Passos para Deploy

### 1. Deploy do Backend (AGORA)

```bash
# Deploy para produção
npx wrangler deploy

# Ou usar o script
npm run deploy:backend
```

**URL do Worker após deploy:**
```
https://loja-mae-api.workers.dev
```

### 2. Atualizar ALLOWED_ORIGINS para Produção

Quando você tiver o domínio do frontend, atualize:

```bash
echo "https://seu-dominio.com,https://www.seu-dominio.com" | npx wrangler secret put ALLOWED_ORIGINS --name loja-mae-api
```

### 3. Configurar Domínio Customizado (Opcional)

No `wrangler.toml`, você já tem configurado:
```toml
[env.production]
route = { pattern = "api.loja-mae.com/*", zone_name = "loja-mae.com" }
```

Para ativar, você precisa:
1. Ter o domínio configurado no Cloudflare
2. Fazer deploy com: `npx wrangler deploy --env production`

### 4. Configurar R2 Public Domain

1. Acesse Cloudflare Dashboard → R2 → loja-mae-images
2. Configure um domínio customizado público
3. Atualize `backend/utils/r2.ts` com o domínio real

### 5. Criar Admin Inicial

Execute o seed para criar dados iniciais:

```bash
npm run d1:seed
```

Ou crie manualmente via SQL:

```bash
npx wrangler d1 execute loja-mae-db --remote --command="
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '\$2a\$10\$...', -- Gere um hash bcrypt da senha
  'Admin',
  'super_admin',
  1
);"
```

**Gerar hash bcrypt:**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('sua-senha', 10).then(h => console.log(h))"
```

### 6. Configurar Webhook Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://loja-mae-api.workers.dev/api/stripe/webhook`
3. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copie o webhook secret e atualize se necessário

### 7. Deploy do Frontend

#### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Opção 2: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Opção 3: Cloudflare Pages

```bash
# Build do frontend
npm run build:frontend

# Upload para Cloudflare Pages via dashboard
# ou usar wrangler pages
```

### 8. Variáveis de Ambiente do Frontend

Configure no seu serviço de hospedagem:

```env
VITE_API_BASE_URL=https://loja-mae-api.workers.dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SKDYtLHRh8zOCQC9z7aWBjfLqzsTNws7mYBcyocHjRQudfuL398pnPAcNK1BaHt839nz399XDccL0wfsglJeSEY00dmBs2VkR
```

## 📋 Checklist de Deploy

- [x] Secrets configurados
- [x] Banco D1 criado e migrado
- [x] Bucket R2 criado
- [ ] Backend deployado
- [ ] ALLOWED_ORIGINS atualizado com domínio de produção
- [ ] Admin criado no banco
- [ ] Webhook Stripe configurado
- [ ] Frontend deployado
- [ ] Variáveis de ambiente do frontend configuradas
- [ ] Domínio R2 público configurado
- [ ] Testes realizados
- [ ] Logs verificados

## 🔧 Comandos Úteis

### Ver logs do Worker:
```bash
npx wrangler tail
```

### Executar SQL no banco:
```bash
npx wrangler d1 execute loja-mae-db --remote --command="SELECT * FROM products;"
```

### Ver informações do Worker:
```bash
npx wrangler deployments list
npx wrangler whoami
```

### Testar API localmente:
```bash
npm run dev:backend
# API em http://localhost:8787
```

## ⚠️ Importante

1. **Stripe Keys LIVE**: Você está usando chaves de produção (`rk_live_` e `pk_live_`). Certifique-se que são as corretas.

2. **ALLOWED_ORIGINS**: Atualize com os domínios reais quando o frontend estiver em produção.

3. **JWT_SECRET**: Mantenha seguro, não compartilhe.

4. **R2 Public URL**: Configure um domínio público para as imagens funcionarem corretamente.

5. **Backup**: Configure backups regulares do banco D1.

## 🆘 Troubleshooting

### Erro 401 ao acessar API
- Verifique ALLOWED_ORIGINS
- Verifique CORS no código

### Erro ao fazer upload de imagem
- Verifique se o bucket R2 existe
- Verifique permissões do Worker no R2
- Configure domínio público do R2

### Erro no webhook Stripe
- Verifique se o endpoint está correto
- Verifique se o secret está correto
- Verifique logs: `npx wrangler tail`

### Erro ao fazer deploy
- Verifique autenticação: `npx wrangler whoami`
- Verifique se todos os secrets estão configurados
- Verifique logs de erro

## 📞 Suporte

Para problemas ou dúvidas, consulte:
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Stripe Docs](https://stripe.com/docs)

---

**Status**: ✅ Pronto para deploy do backend!
**Próximo passo**: Execute `npx wrangler deploy` para fazer o deploy.

