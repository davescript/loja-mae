# 🔐 Configurar Secrets no GitHub - GUIA RÁPIDO

## 📋 Secrets Necessários

### 1. CLOUDFLARE_API_TOKEN
```
mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk
```

### 2. CLOUDFLARE_ACCOUNT_ID
```
55b0027975cda6f67a48ea231d2cef8d
```

## 🚀 Método 1: Via Interface Web (Mais Fácil)

1. **Acesse:**
   https://github.com/davescript/loja-mae/settings/secrets/actions

2. **Adicionar CLOUDFLARE_API_TOKEN:**
   - Clique em **"New repository secret"**
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Secret:** `mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk`
   - Clique em **"Add secret"**

3. **Adicionar CLOUDFLARE_ACCOUNT_ID:**
   - Clique em **"New repository secret"** novamente
   - **Name:** `CLOUDFLARE_ACCOUNT_ID`
   - **Secret:** `55b0027975cda6f67a48ea231d2cef8d`
   - Clique em **"Add secret"**

## 🖥️ Método 2: Via GitHub CLI

### Instalar GitHub CLI (se não tiver):

```bash
# macOS
brew install gh

# Ou baixar de: https://cli.github.com/
```

### Autenticar:

```bash
gh auth login
```

### Configurar Secrets:

```bash
# Configurar CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_API_TOKEN \
  -b "mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk" \
  -R davescript/loja-mae

# Configurar CLOUDFLARE_ACCOUNT_ID
gh secret set CLOUDFLARE_ACCOUNT_ID \
  -b "55b0027975cda6f67a48ea231d2cef8d" \
  -R davescript/loja-mae
```

## ✅ Verificar

Após configurar os secrets:

1. **Fazer um push vazio para trigger:**
   ```bash
   git commit --allow-empty -m "Trigger GitHub Actions"
   git push
   ```

2. **Verificar workflow:**
   - Acesse: https://github.com/davescript/loja-mae/actions
   - Você deve ver o workflow "Deploy to Cloudflare Workers" executando

3. **Ver logs:**
   - Clique no workflow run
   - Veja os logs de deploy

## 🔧 Configurar Token Localmente

Para desenvolvimento local, adicione ao seu `.zshrc` ou `.bashrc`:

```bash
export CLOUDFLARE_API_TOKEN="mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk"
```

Ou crie um arquivo `.env.local`:
```
CLOUDFLARE_API_TOKEN=mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk
```

## 📝 Status Atual

- ✅ Token Cloudflare validado
- ✅ Account ID obtido
- ✅ GitHub Actions workflow configurado
- ⏭️ Secrets precisam ser configurados no GitHub

## 🔗 Links Úteis

- **GitHub Secrets:** https://github.com/davescript/loja-mae/settings/secrets/actions
- **GitHub Actions:** https://github.com/davescript/loja-mae/actions
- **Repositório:** https://github.com/davescript/loja-mae

---

**Próximo passo:** Configure os secrets no GitHub para habilitar deploy automático!

