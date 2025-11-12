# 🔧 Solução para Criar Admin - Guia Completo

## ❌ Problema: Erro de Autenticação

Se você está recebendo o erro:
```
Authentication error [code: 10000]
```

Isso significa que o token de API do Cloudflare não tem permissões ou está expirado.

## ✅ Soluções

### **Solução 1: Login Interativo (RECOMENDADO)**

Esta é a forma mais simples e recomendada:

```bash
# 1. Remover token antigo (se houver)
unset CLOUDFLARE_API_TOKEN

# 2. Fazer login interativo
npx wrangler login

# 3. Executar script de criação de admin
./scripts/criar-admin-sql.sh --remote
```

O `wrangler login` abrirá seu navegador para autenticação.

---

### **Solução 2: Via Cloudflare Dashboard (MAIS FÁCIL)**

Se o login interativo não funcionar, use o Dashboard:

1. **Acesse o Dashboard:**
   - https://dash.cloudflare.com
   - Faça login na sua conta

2. **Navegue até o D1:**
   - Workers & Pages → D1
   - Clique em `loja-mae-db`

3. **Execute SQL:**
   - Clique em "Query"
   - Cole o SQL abaixo:

```sql
-- Remover admin existente se houver
DELETE FROM admins WHERE email = 'admin@loja-mae.com';

-- Criar novo admin
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@loja-mae.com',
  '$2a$10$07DxzALU/HGaPhcOmyGkYOV1erNf69i/8Ozfj8cV7AYY4TeZSXGM.',
  'Administrador',
  'super_admin',
  1
);
```

4. **Clique em "Run"**

**Nota:** O hash acima é para a senha `admin123`. Se quiser outra senha, gere o hash primeiro:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('sua-senha', bcrypt.genSaltSync(10)));"
```

---

### **Solução 3: Gerar Hash e Usar SQL Manual**

1. **Gere o hash da senha:**
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', bcrypt.genSaltSync(10)));"
```

2. **Copie o hash gerado**

3. **Edite o arquivo SQL:**
```bash
nano scripts/criar-admin-manual.sql
```

4. **Substitua `$2a$10$YOUR_HASH_HERE` pelo hash gerado**

5. **Execute:**
```bash
npx wrangler d1 execute loja-mae-db --remote --file=./scripts/criar-admin-manual.sql
```

---

### **Solução 4: Via API REST (Avançado)**

Se você tem um token de API com permissões D1:

```bash
# Configure o token
export CLOUDFLARE_API_TOKEN=seu_token_aqui
export CLOUDFLARE_ACCOUNT_ID=55b0027975cda6f67a48ea231d2cef8d

# Execute o script
./scripts/criar-admin-via-api.sh
```

**Para criar um token de API:**
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em "Create Token"
3. Use o template "Edit Cloudflare Workers" ou crie um custom
4. Adicione permissões para D1: `Account.Cloudflare D1:Edit`

---

## 🧪 Verificar se Admin foi Criado

Após criar o admin, teste o login:

```bash
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loja-mae.com","password":"admin123"}'
```

Ou acesse o painel admin:
- URL: `/admin/login`
- Email: `admin@loja-mae.com`
- Senha: `admin123`

---

## 📋 Credenciais Padrão

- **Email:** `admin@loja-mae.com`
- **Senha:** `admin123`

**⚠️ IMPORTANTE:** Altere a senha após o primeiro login!

---

## 🆘 Ainda com Problemas?

1. **Verifique se o banco existe:**
```bash
npx wrangler d1 list
```

2. **Verifique se a tabela admins existe:**
```bash
npx wrangler d1 execute loja-mae-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='admins';"
```

3. **Verifique logs do Wrangler:**
```bash
cat ~/Library/Preferences/.wrangler/logs/wrangler-*.log | tail -50
```

---

**Recomendação:** Use a **Solução 2 (Dashboard)** se estiver com dificuldades - é a mais simples e sempre funciona!

