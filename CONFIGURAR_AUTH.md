# 🔐 Configuração de Autenticação Cloudflare

## 📋 Resumo

Para **deploy local**: Use **OAuth** (npx wrangler login)  
Para **GitHub Actions**: Use **API Token** como secret

## ❌ Problema Atual

O erro `Authentication error [code: 10000]` ocorre porque há um `CLOUDFLARE_API_TOKEN` configurado em uma variável de ambiente que está conflitando com o OAuth.

## ✅ Solução: Remover Token do Shell

### Opção 1: Script Automático (Recomendado)

```bash
./scripts/remover-token-shell.sh
```

O script irá:
1. Procurar `CLOUDFLARE_API_TOKEN` em arquivos de configuração
2. Mostrar onde está configurado
3. Oferecer para remover (com backup)
4. Remover da sessão atual

### Opção 2: Manual

```bash
# 1. Procurar onde está configurado
grep -r "CLOUDFLARE_API_TOKEN" ~/.zshrc ~/.zprofile ~/.bashrc

# 2. Editar o arquivo e remover a linha
nano ~/.zshrc  # ou o arquivo onde encontrou

# 3. Remover da sessão atual
unset CLOUDFLARE_API_TOKEN

# 4. Recarregar shell
source ~/.zshrc

# 5. Fazer login via OAuth
npx wrangler login
```

## 🔑 Quando Usar Token vs OAuth

### OAuth (Deploy Local) ✅
- **Quando**: Desenvolvimento local, testes, deploy manual
- **Como**: `npx wrangler login`
- **Vantagem**: Mais seguro, não precisa gerenciar tokens
- **Uso**: Comandos `wrangler` no terminal

### API Token (CI/CD) ✅
- **Quando**: GitHub Actions, CI/CD automatizado
- **Como**: Configurar como secret no GitHub
- **Vantagem**: Funciona em ambientes sem interação
- **Uso**: GitHub Actions workflow

## 🚀 Depois de Remover o Token

### 1. Fazer Login OAuth

```bash
npx wrangler login
```

### 2. Verificar Autenticação

```bash
npx wrangler whoami
```

### 3. Fazer Deploy

```bash
npm run deploy:backend
# ou
./scripts/deploy.sh
```

### 4. Listar Secrets

```bash
npx wrangler secret list --env production
```

## 🔐 Configurar Token para GitHub Actions (Opcional)

Se você quiser usar token para GitHub Actions (já está configurado):

1. **Gerar Token no Cloudflare:**
   - Acesse: https://dash.cloudflare.com/profile/api-tokens
   - Clique em "Create Token"
   - Use template "Edit Cloudflare Workers" ou permissões customizadas:
     - Account: Workers Scripts (Edit)
     - Account: D1 (Edit)
     - Account: R2 (Edit)
     - Account: Workers KV (Edit)
     - Zone: Zone Settings (Read)

2. **Adicionar como Secret no GitHub:**
   - Repo → Settings → Secrets and variables → Actions
   - Adicionar `CLOUDFLARE_API_TOKEN` com o valor do token
   - Adicionar `CLOUDFLARE_ACCOUNT_ID` (encontre em: https://dash.cloudflare.com/)

3. **O workflow já está configurado** em `.github/workflows/deploy.yml`

## ⚠️ Importante

- **NÃO** configure `CLOUDFLARE_API_TOKEN` no seu shell para uso local
- Use **OAuth** para desenvolvimento local
- Use **Token** apenas para CI/CD (GitHub Actions)
- Se você já tem token configurado, remova antes de usar OAuth

## 🧪 Testar

Depois de remover o token:

```bash
# Deve funcionar sem erro
npx wrangler whoami

# Deve funcionar sem erro
npx wrangler secret list --env production

# Deve fazer deploy com sucesso
npm run deploy:backend
```

