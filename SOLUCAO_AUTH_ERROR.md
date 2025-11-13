# 🔐 Solução para Erro de Autenticação do Wrangler

## ❌ Erro Encontrado

```
Authentication error [code: 10000]
It looks like you are authenticating Wrangler via a custom API token set in an environment variable.
Please ensure it has the correct permissions for this operation.
```

## ✅ Soluções

### Opção 1: Login Interativo (Recomendado - Mais Fácil)

Este método abre o navegador para fazer login via OAuth:

```bash
# Remover token antigo (se existir)
unset CLOUDFLARE_API_TOKEN

# Fazer login interativo
npx wrangler login
```

Isso abrirá seu navegador para autenticação. Após autenticar, você poderá configurar os secrets.

### Opção 2: Atualizar Token de API

Se você prefere usar um token de API:

1. **Criar/Atualizar Token:**
   - Acesse: https://dash.cloudflare.com/profile/api-tokens
   - Clique em "Create Token"
   - Use o template "Edit Cloudflare Workers" ou configure manualmente:

2. **Permissões Necessárias:**
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **Workers Routes** → **Edit**
   - **Account** → **Workers KV** → **Edit** (se usar KV)
   - **Account** → **D1** → **Edit** (para banco de dados)
   - **Account** → **R2** → **Edit** (para storage)
   - **User** → **User Details** → **Read**

3. **Configurar Token:**
   ```bash
   export CLOUDFLARE_API_TOKEN="seu-token-aqui"
   ```

4. **Ou adicionar ao ~/.zshrc ou ~/.bashrc:**
   ```bash
   echo 'export CLOUDFLARE_API_TOKEN="seu-token-aqui"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Opção 3: Usar Script Automatizado

```bash
./scripts/fix-auth-wrangler.sh
```

Este script guia você através do processo de autenticação.

## 🔍 Verificar Autenticação

Após autenticar, teste com:

```bash
npx wrangler whoami
```

Você deve ver suas informações de conta.

## 📝 Configurar Secrets Após Autenticação

Depois de autenticar corretamente:

```bash
# Opção 1: Script automatizado
./scripts/configurar-secrets-email.sh

# Opção 2: Manual
echo "noreply@leiasabores.pt" | npx wrangler secret put FROM_EMAIL --env production
echo "Loja Mãe" | npx wrangler secret put FROM_NAME --env production
```

## ⚠️ Troubleshooting

### "Permission denied" mesmo após login

- Verifique se você tem acesso à conta Cloudflare
- Verifique se o Worker existe: `npx wrangler deployments list`
- Tente fazer logout e login novamente: `npx wrangler logout && npx wrangler login`

### Token não funciona

- Gere um novo token com todas as permissões listadas acima
- Certifique-se de que o token não expirou
- Verifique se está usando o token correto para a conta certa

### Múltiplas contas Cloudflare

Se você tem múltiplas contas, especifique a conta:

```bash
npx wrangler secret put FROM_EMAIL --env production --account-id SUA_ACCOUNT_ID
```

Para encontrar sua Account ID:
- Cloudflare Dashboard → Selecione seu domínio → Overview → Account ID (lado direito)

