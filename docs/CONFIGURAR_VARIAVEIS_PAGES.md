# 🔧 Configurar Variáveis de Ambiente no Cloudflare Pages

## ⚠️ Problema: Tela Branca

O site está mostrando tela branca porque a variável de ambiente `VITE_API_BASE_URL` não está configurada no Cloudflare Pages.

## ✅ Solução: Configurar Variáveis de Ambiente

### 1. Acessar o Dashboard do Cloudflare Pages

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Workers & Pages** → **Pages**
3. Clique no projeto **loja-mae**

### 2. Configurar Variáveis de Ambiente

1. Vá em **Settings** → **Environment variables**
2. Clique em **Add variable**
3. Adicione as seguintes variáveis:

#### Para Production:
- **Variable name**: `VITE_API_BASE_URL`
- **Value**: `https://loja-mae-api.davecdl.workers.dev`
- **Environment**: Production

#### Para Preview:
- **Variable name**: `VITE_API_BASE_URL`
- **Value**: `https://loja-mae-api.davecdl.workers.dev`
- **Environment**: Preview

### 3. Redeploy do Frontend

Após configurar as variáveis, você precisa fazer um novo deploy:

```bash
# Fazer um pequeno commit para triggerar o deploy
git commit --allow-empty -m "Trigger Pages deploy"
git push
```

Ou faça o deploy manual:

```bash
npm run build:frontend
npx wrangler pages deploy dist --project-name=loja-mae
```

## 🔍 Verificar se está funcionando

1. Abra o site: https://www.leiasabores.pt
2. Abra o console do navegador (F12)
3. Verifique se há erros JavaScript
4. Verifique se as requisições para a API estão sendo feitas corretamente

## 📋 Variáveis Necessárias

- `VITE_API_BASE_URL`: URL da API backend
  - Production: `https://loja-mae-api.davecdl.workers.dev`
  - Ou: `https://api.leiasabores.pt` (se configurado)

- `VITE_STRIPE_PUBLISHABLE_KEY`: Chave pública do Stripe (opcional)
  - Formato: `pk_live_...` ou `pk_test_...`

## 🐛 Troubleshooting

### Se ainda houver tela branca:

1. **Verifique o console do navegador**:
   - Abra F12 → Console
   - Procure por erros JavaScript
   - Verifique se há erros de rede (CORS, 404, etc.)

2. **Verifique se a API está online**:
   ```bash
   curl https://loja-mae-api.davecdl.workers.dev/api/health
   ```

3. **Verifique as variáveis de ambiente**:
   - No Cloudflare Pages, vá em Settings → Environment variables
   - Confirme que `VITE_API_BASE_URL` está configurada
   - Confirme que está no ambiente correto (Production)

4. **Limpe o cache do navegador**:
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

5. **Verifique os logs do Cloudflare Pages**:
   - No dashboard, vá em Deployments
   - Clique no último deployment
   - Verifique os logs de build

## 📝 Notas Importantes

- As variáveis de ambiente começam com `VITE_` são expostas ao frontend
- Após adicionar variáveis, é necessário fazer um novo deploy
- O frontend precisa ser reconstruído para incluir as variáveis
- As variáveis são injetadas no momento do build, não em runtime

## 🔗 Links Úteis

- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

