# 🔧 Troubleshooting - Cloudflare Pages Deploy

## ❌ Erros Comuns e Soluções

### 1. Erro: "Project not found"

**Problema**: O projeto `loja-mae-frontend` não existe no Cloudflare Pages.

**Solução**:
1. Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
2. Crie o projeto manualmente:
   - Clique em "Create a project"
   - Escolha "Connect to Git"
   - Selecione o repositório: `davescript/loja-mae`
   - Configure:
     - **Nome**: `loja-mae-frontend`
     - **Production branch**: `main`
     - **Build command**: `npm run build:frontend`
     - **Build output directory**: `dist`
   - Clique em "Save and Deploy"

### 2. Erro: "Authentication failed"

**Problema**: Secrets do GitHub não configurados ou incorretos.

**Solução**:
1. Verifique se os secrets estão configurados:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
2. Configure em: https://github.com/davescript/loja-mae/settings/secrets/actions

### 3. Erro: "Build failed"

**Problema**: Build command incorreto ou dependências faltando.

**Solução**:
1. Teste localmente:
   ```bash
   npm run build:frontend
   ```
2. Verifique se o diretório `dist/` é gerado
3. Verifique se há erros no build
4. Verifique se `package.json` tem todas as dependências

### 4. Erro: "Directory not found: dist"

**Problema**: O diretório `dist/` não foi gerado ou está no lugar errado.

**Solução**:
1. Verifique se o build command está correto: `npm run build:frontend`
2. Verifique se o build output directory está correto: `dist`
3. Verifique se o diretório `dist/` está no `.gitignore` (deve estar)

### 5. Erro: "Permission denied"

**Problema**: Token do GitHub não tem permissão para deploy.

**Solução**:
1. Verifique se `GITHUB_TOKEN` está disponível (é automático)
2. Verifique se o workflow tem as permissões corretas:
   ```yaml
   permissions:
     contents: read
     deployments: write
   ```

### 6. Erro: "API rate limit exceeded"

**Problema**: Muitas requisições à API do Cloudflare.

**Solução**:
1. Aguarde alguns minutos
2. Verifique se há muitos deploys simultâneos
3. Considere usar deploy manual via Wrangler

## 🔍 Verificar Status do Deploy

### Via GitHub Actions:
1. Acesse: https://github.com/davescript/loja-mae/actions
2. Clique no workflow "Deploy Frontend to Cloudflare Pages"
3. Veja os logs de erro

### Via Cloudflare Pages:
1. Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
2. Clique no projeto `loja-mae-frontend`
3. Veja os deployments e logs

## 🧪 Testar Localmente

```bash
# Build
npm run build:frontend

# Verificar se dist/ foi gerado
ls -la dist/

# Deploy manual
npx wrangler pages deploy dist --project-name=loja-mae-frontend
```

## 📋 Checklist de Verificação

- [ ] Projeto Pages existe: `loja-mae-frontend`
- [ ] Secrets configurados no GitHub
- [ ] Build funciona localmente
- [ ] Diretório `dist/` é gerado
- [ ] Workflow tem permissões corretas
- [ ] Build command correto: `npm run build:frontend`
- [ ] Build output correto: `dist`
- [ ] Variáveis de ambiente configuradas (se necessário)

## 🔗 Links Úteis

- GitHub Actions: https://github.com/davescript/loja-mae/actions
- Cloudflare Pages: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/pages
- GitHub Secrets: https://github.com/davescript/loja-mae/settings/secrets/actions

## 💡 Dica

Se o deploy via GitHub Actions não funcionar, use o deploy manual:

```bash
# Build
npm run build:frontend

# Deploy
npx wrangler pages deploy dist --project-name=loja-mae-frontend
```

---

**Status**: Verifique os logs para identificar o erro específico

