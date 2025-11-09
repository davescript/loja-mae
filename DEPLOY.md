# 🚀 Guia de Deploy - Loja Mãe

## ✅ Configuração Concluída

### Secrets Configurados no Cloudflare:
- ✅ JWT_SECRET
- ✅ STRIPE_SECRET_KEY  
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ ALLOWED_ORIGINS

### Banco de Dados:
- ✅ D1 Database criado: `loja-mae-db`
- ✅ Migrations aplicadas (remote)
- ✅ Database ID: `9815d658-ce3b-4b8a-be98-90563c950182`

### R2 Storage:
- ⚠️ Verificar se o bucket `loja-mae-images` foi criado

## 📋 Próximos Passos para Deploy

### 1. Verificar/Criar Bucket R2

```bash
# Listar buckets existentes
npx wrangler r2 bucket list

# Se não existir, criar
npx wrangler r2 bucket create loja-mae-images
```

### 2. Atualizar ALLOWED_ORIGINS para Produção

Quando você tiver o domínio do frontend em produção, atualize:

```bash
# Exemplo com domínio real
echo "https://loja-mae.com,https://www.loja-mae.com" | npx wrangler secret put ALLOWED_ORIGINS --name loja-mae-api
```

### 3. Configurar Domínio R2 (Opcional)

Para usar URLs públicas do R2:

1. Acesse o dashboard do Cloudflare
2. Vá em R2 → loja-mae-images → Settings
3. Configure um domínio customizado público
4. Atualize `backend/utils/r2.ts` com o domínio correto

### 4. Deploy do Backend

```bash
# Build e deploy
npm run deploy:backend

# Ou apenas deploy
npx wrangler deploy
```

### 5. Deploy do Frontend

O frontend pode ser deployado em:
- **Vercel** (recomendado)
- **Netlify**
- **Cloudflare Pages**
- **Outro serviço de hospedagem estática**

#### Exemplo com Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Configurar Variáveis de Ambiente no Frontend:

```env
VITE_API_BASE_URL=https://loja-mae-api.workers.dev
# ou seu domínio customizado
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SKDYtLHRh8zOCQC9z7aWBjfLqzsTNws7mYBcyocHjRQudfuL398pnPAcNK1BaHt839nz399XDccL0wfsglJeSEY00dmBs2VkR
```

### 6. Configurar Webhook do Stripe

1. Acesse o dashboard do Stripe
2. Vá em Developers → Webhooks
3. Adicione endpoint: `https://loja-mae-api.workers.dev/api/stripe/webhook`
4. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copie o webhook secret e atualize se necessário:
   ```bash
   echo "whsec_..." | npx wrangler secret put STRIPE_WEBHOOK_SECRET --name loja-mae-api
   ```

### 7. Criar Admin Inicial

Execute o seed para criar um admin:

```bash
npm run d1:seed
```

Ou crie manualmente via SQL:

```sql
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '$2a$10$...', -- Hash bcrypt da senha
  'Admin',
  'super_admin',
  1
);
```

### 8. Testar Produção

1. Acesse a URL do frontend em produção
2. Teste criar uma conta
3. Teste fazer login
4. Teste criar um produto (admin)
5. Teste checkout com Stripe (modo teste primeiro)

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
npx wrangler whoami
npx wrangler deployments list
```

## ⚠️ Importante

1. **ALLOWED_ORIGINS**: Atualize com os domínios reais de produção
2. **Stripe Keys**: Você está usando chaves LIVE (rk_live_ e pk_live_). Certifique-se que são as corretas
3. **JWT_SECRET**: Mantenha seguro, não compartilhe
4. **R2 Public URL**: Configure um domínio público para as imagens
5. **Backup**: Configure backups regulares do banco D1

## 📝 Checklist de Deploy

- [ ] Bucket R2 criado
- [ ] ALLOWED_ORIGINS atualizado com domínio de produção
- [ ] Backend deployado
- [ ] Frontend deployado
- [ ] Variáveis de ambiente do frontend configuradas
- [ ] Webhook Stripe configurado
- [ ] Admin criado no banco
- [ ] Testes realizados
- [ ] Logs verificados
- [ ] Backup configurado

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

