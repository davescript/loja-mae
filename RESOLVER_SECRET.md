# 🔐 Resolver Problema de Secret no GitHub

## ⚠️ Problema

O GitHub está bloqueando o push porque detectou um token em um commit antigo no histórico.

## ✅ Solução 1: Permitir o Secret (Recomendado)

Se o token do GitHub já foi revogado ou não é mais usado:

1. **Acesse o link fornecido pelo GitHub:**
   https://github.com/davescript/loja-mae/security/secret-scanning/unblock-secret/35EPN3jTbWroIqZmkqYZ1wJgmuo

2. **Siga as instruções para permitir o secret**
   (Isso permite que o commit antigo permaneça no histórico)

3. **Faça push novamente:**
   ```bash
   git push
   ```

## ✅ Solução 2: Reescrever Histórico (Alternativa)

Se preferir remover completamente o token do histórico:

```bash
# Fazer backup
git branch backup-main

# Usar git filter-repo (instalar primeiro: brew install git-filter-repo)
# Ou usar BFG Repo-Cleaner
# Ou fazer rebase interativo

# Remover o commit problemático
git rebase -i <commit-anterior-ao-problematico>

# Editar o commit para remover o token
# Fazer push forçado
git push --force
```

## 📋 Informações dos Secrets

### Token Cloudflare (VALIDADO ✅)
```
CLOUDFLARE_API_TOKEN: mhJCle0uRfJEu6W8zKhxUCoM7pgrbWvW7ssStzqk
CLOUDFLARE_ACCOUNT_ID: 55b0027975cda6f67a48ea231d2cef8d
```

### Token GitHub (no histórico antigo)
- O token GitHub antigo está em um commit antigo
- Se ainda estiver ativo, considere revogá-lo
- Se já foi revogado, pode permitir no GitHub

## 🚀 Após Resolver

1. Configure os secrets no GitHub:
   https://github.com/davescript/loja-mae/settings/secrets/actions

2. Adicione:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

3. Faça um push vazio para trigger:
   ```bash
   git commit --allow-empty -m "Trigger GitHub Actions"
   git push
   ```

## 🔗 Links

- **Permitir secret:** https://github.com/davescript/loja-mae/security/secret-scanning/unblock-secret/35EPN3jTbWroIqZmkqYZ1wJgmuo
- **GitHub Secrets:** https://github.com/davescript/loja-mae/settings/secrets/actions
- **GitHub Actions:** https://github.com/davescript/loja-mae/actions

---

**Recomendação:** Use a Solução 1 (permitir o secret) se o token GitHub já foi revogado.

