# 🔧 Troubleshooting - Erro no Deploy

## ✅ Status Atual

O build local está funcionando perfeitamente:
- ✅ Build sem erros
- ✅ Deploy manual funcionando
- ✅ Código sem erros de lint

## 🔍 Possíveis Causas do Erro

### 1. **GitHub Actions Secrets**
Verifique se os secrets estão configurados:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_API_BASE_URL` (opcional)
- `VITE_STRIPE_PUBLISHABLE_KEY` (opcional)

### 2. **Workflow não está sendo acionado**
O workflow só roda quando há mudanças em:
- `frontend/**`
- `index.html`
- `package.json`
- `vite.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `.github/workflows/deploy-frontend.yml`
- `public/**`
- `shared/**` (adicionado recentemente)

### 3. **Erro no Build do GitHub Actions**
Verifique os logs do GitHub Actions:
1. Acesse: https://github.com/davescript/loja-mae/actions
2. Clique no último workflow que falhou
3. Veja os logs do step "Build frontend"

## 🚀 Soluções

### Solução 1: Deploy Manual (Funcionando)
```bash
npm run build:frontend
echo "/*    /index.html   200" > dist/_redirects
cp public/_headers dist/_headers
npx wrangler pages deploy dist --project-name=loja-mae
```

### Solução 2: Forçar Deploy via GitHub Actions
1. Acesse: https://github.com/davescript/loja-mae/actions
2. Clique em "Deploy Frontend to Cloudflare Pages"
3. Clique em "Run workflow"
4. Selecione a branch `main`
5. Clique em "Run workflow"

### Solução 3: Verificar Secrets
```bash
# No GitHub, vá em:
# Settings > Secrets and variables > Actions
# Verifique se todos os secrets estão configurados
```

### Solução 4: Verificar Logs
Se o erro persistir, verifique:
1. Logs do GitHub Actions
2. Logs do Cloudflare Pages
3. Console do navegador (F12)

## 📝 Checklist

- [ ] Build local funciona (`npm run build:frontend`)
- [ ] Deploy manual funciona (`npx wrangler pages deploy`)
- [ ] Secrets do GitHub estão configurados
- [ ] Workflow está sendo acionado
- [ ] Logs do GitHub Actions foram verificados

## 🆘 Se o Problema Persistir

1. **Forçar novo deploy:**
   ```bash
   git commit --allow-empty -m "Trigger deploy"
   git push
   ```

2. **Verificar status do Cloudflare Pages:**
   - Acesse: https://dash.cloudflare.com
   - Vá em Pages > loja-mae
   - Verifique os últimos deploys

3. **Contatar suporte:**
   - GitHub Actions: https://github.com/actions
   - Cloudflare: https://support.cloudflare.com

---

**Última atualização:** $(date)
**Status do build local:** ✅ Funcionando
**Status do deploy manual:** ✅ Funcionando

