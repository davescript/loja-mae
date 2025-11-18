# 🔐 Configurar Secrets no GitHub - INSTRUÇÕES

## 📋 Secrets para Configurar

### 1. CLOUDFLARE_API_TOKEN
```
(Configure no GitHub - obtenha o valor do seu .dev.vars ou Cloudflare Dashboard)
```

### 2. CLOUDFLARE_ACCOUNT_ID
```
55b0027975cda6f67a48ea231d2cef8d
```

## 🚀 Como Configurar (Método Manual)

1. **Acesse:**
   https://github.com/davescript/loja-mae/settings/secrets/actions

2. **Adicione CLOUDFLARE_API_TOKEN:**
   - Clique em "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: (Veja seu arquivo .dev.vars ou Cloudflare Dashboard)
   - Clique em "Add secret"

3. **Adicione CLOUDFLARE_ACCOUNT_ID:**
   - Clique em "New repository secret"
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Secret: `55b0027975cda6f67a48ea231d2cef8d`
   - Clique em "Add secret"

## ⚠️ Resolver Problema de Push

O GitHub está bloqueando pushes porque há um token em um commit antigo.

### Opção 1: Permitir o Secret (Mais Rápido)

1. Acesse: https://github.com/davescript/loja-mae/security/secret-scanning/unblock-secret/35EPN3jTbWroIqZmkqYZ1wJgmuo
2. Clique em "Allow secret"
3. Faça push novamente: `git push`

### Opção 2: Reescrever Histórico

```bash
# Criar novo branch limpo
git checkout --orphan main-clean
git add .
git commit -m "Initial commit: E-commerce completo"
git branch -D main
git branch -m main
git push -f origin main
```

## ✅ Após Configurar

1. Secrets configurados no GitHub
2. Deploy automático será ativado
3. Ver workflow em: https://github.com/davescript/loja-mae/actions

---

**Status:** ✅ Token Cloudflare validado
**Próximo passo:** Configure os secrets no GitHub

