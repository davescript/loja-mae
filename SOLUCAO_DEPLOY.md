# 🔧 Solução para Erro de Deploy

## ❌ Erro Encontrado

```
Authentication error [code: 10000]
```

## ✅ Solução

### Opção 1: Usar Script Automático

```bash
./scripts/fix-deploy-auth.sh
```

O script irá:
1. Remover `CLOUDFLARE_API_TOKEN` se existir
2. Verificar autenticação
3. Fazer login se necessário

### Opção 2: Manual

```bash
# 1. Remover token antigo
unset CLOUDFLARE_API_TOKEN

# 2. Verificar autenticação
npx wrangler whoami

# 3. Se não estiver autenticado, fazer login
npx wrangler login

# 4. Tentar deploy novamente
npm run deploy:backend
```

## 🔍 Verificar Variáveis de Ambiente

```bash
# Ver se há token configurado
echo $CLOUDFLARE_API_TOKEN

# Se houver, remover
unset CLOUDFLARE_API_TOKEN

# Verificar arquivos de configuração do shell
grep -r "CLOUDFLARE_API_TOKEN" ~/.zshrc ~/.bashrc ~/.bash_profile 2>/dev/null
```

## 📝 Depois de Autenticar

Após autenticar com sucesso, você pode:

1. **Fazer deploy:**
   ```bash
   npm run deploy:backend
   ```

2. **Configurar secrets do Stripe:**
   ```bash
   ./scripts/configurar-stripe-comandos.sh
   ```

3. **Verificar secrets:**
   ```bash
   npx wrangler secret list --env production
   ```

## ⚠️ Importante

- O GitHub Actions usa `CLOUDFLARE_API_TOKEN` como secret (isso está correto)
- Para deploy local, use `npx wrangler login` (OAuth)
- Não misture os dois métodos
