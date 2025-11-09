# 🔐 Configurar Secrets no GitHub Actions

## 📋 Secrets Necessários

Configure os seguintes secrets no GitHub para habilitar deploy automático:

### 1. CLOUDFLARE_API_TOKEN

**Valor:**
```
(Configure no GitHub - veja CONFIGURAR_SECRETS.md para o valor)
```

### 2. CLOUDFLARE_ACCOUNT_ID

**Valor:**
```
55b0027975cda6f67a48ea231d2cef8d
```
*(Obtido do seu account)*

## 🚀 Como Configurar

### Passo 1: Acessar Secrets

1. Acesse: https://github.com/davescript/loja-mae/settings/secrets/actions
2. Clique em **"New repository secret"**

### Passo 2: Adicionar CLOUDFLARE_API_TOKEN

1. **Name:** `CLOUDFLARE_API_TOKEN`
2. **Secret:** (Veja CONFIGURAR_SECRETS.md ou INSTRUCOES_SECRETS.md para o valor)
3. Clique em **"Add secret"**

### Passo 3: Adicionar CLOUDFLARE_ACCOUNT_ID

1. Clique em **"New repository secret"** novamente
2. **Name:** `CLOUDFLARE_ACCOUNT_ID`
3. **Secret:** `55b0027975cda6f67a48ea231d2cef8d`
4. Clique em **"Add secret"**

## ✅ Verificar

Após configurar os secrets:

1. Faça um push para o repositório:
   ```bash
   git commit --allow-empty -m "Trigger GitHub Actions"
   git push
   ```

2. Verifique o workflow em:
   https://github.com/davescript/loja-mae/actions

3. O deploy automático deve ser executado

## 🔧 Configurar Token Localmente (Opcional)

Para desenvolvimento local, você pode configurar o token:

```bash
# Exportar como variável de ambiente
export CLOUDFLARE_API_TOKEN="seu-token-aqui"

# Ou adicionar ao .zshrc/.bashrc
echo 'export CLOUDFLARE_API_TOKEN="seu-token-aqui"' >> ~/.zshrc
```

## 📝 Permissões do Token

O token precisa ter as seguintes permissões:
- ✅ Account → Cloudflare Workers → Edit
- ✅ Account → Account Settings → Read
- ✅ Account → Cloudflare D1 → Edit
- ✅ Zone → Zone Settings → Read (se usar rotas customizadas)

## 🆘 Troubleshooting

### Erro: "Authentication error"
- Verifique se o token está correto
- Verifique se o token tem as permissões necessárias
- Verifique se o Account ID está correto

### Erro: "Repository rule violations"
- Verifique se os secrets estão configurados corretamente
- Verifique se o workflow está correto

### Deploy não executa
- Verifique se os secrets estão configurados
- Verifique os logs em: Actions → Workflow run
- Verifique se o branch está correto (main)

## 🔗 Links Úteis

- GitHub Secrets: https://github.com/davescript/loja-mae/settings/secrets/actions
- GitHub Actions: https://github.com/davescript/loja-mae/actions
- Cloudflare Dashboard: https://dash.cloudflare.com/
- Cloudflare API Tokens: https://dash.cloudflare.com/profile/api-tokens

---

**Status**: ⏭️ Configure os secrets para habilitar deploy automático
**Valores dos tokens**: Veja CONFIGURAR_SECRETS.md ou INSTRUCOES_SECRETS.md
