# 🔍 Debug: Login Admin Não Funciona

## ✅ Verificações Realizadas

### **1. API Funcionando**
```bash
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loja-mae.com","password":"admin123"}'
```

**Resultado:** ✅ Sucesso - Token gerado corretamente

### **2. Admin Existe no Banco**
```sql
SELECT id, email, name, role, is_active FROM admins WHERE email = 'admin@loja-mae.com';
```

**Resultado:** ✅ Admin existe (ID: 3, ativo)

## 🔧 Correções Aplicadas

### **1. Melhor Tratamento de Erros**
- Adicionado verificação de `response.success` no login
- Melhor tratamento de erros na API
- Logs de debug adicionados

### **2. Verificação de Resposta da API**
- Verifica se `response.success === true`
- Lança erro se a resposta não for bem-sucedida
- Logs de erro no console

## 🧪 Como Testar

### **1. Abra o Console do Navegador (F12)**
- Vá em "Console"
- Tente fazer login
- Veja se há erros

### **2. Verifique a Rede (Network Tab)**
- Vá em "Network"
- Tente fazer login
- Clique na requisição `/api/auth/admin/login`
- Veja a resposta

### **3. Verifique o Token**
Após tentar fazer login, no Console:
```javascript
localStorage.getItem('admin_token')
```
Deve retornar um token JWT.

## 🐛 Possíveis Problemas

### **1. CORS**
Se houver erro de CORS:
- Verifique se `ALLOWED_ORIGINS` inclui o domínio
- Verifique se a API está acessível

### **2. URL da API**
Verifique se a URL da API está correta:
```javascript
// No Console do navegador
console.log(API_BASE_URL)
```

### **3. Token Não Salvo**
Se o token não estiver sendo salvo:
- Verifique se `localStorage` está habilitado
- Verifique se não há bloqueio de cookies/localStorage

## 📋 Checklist de Debug

- [ ] Console do navegador aberto (F12)
- [ ] Tentar fazer login
- [ ] Verificar erros no Console
- [ ] Verificar requisição na aba Network
- [ ] Verificar resposta da API
- [ ] Verificar se token foi salvo: `localStorage.getItem('admin_token')`
- [ ] Verificar URL da API: deve ser `https://loja-mae-api.davecdl.workers.dev` ou `https://api.leiasabores.pt`

## 🔧 Solução Rápida

Se ainda não funcionar, tente:

1. **Limpar cache e localStorage:**
```javascript
// No Console do navegador
localStorage.clear()
location.reload()
```

2. **Fazer login via API direto:**
```bash
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loja-mae.com","password":"admin123"}' \
  -c cookies.txt
```

3. **Copiar o token e usar no localStorage:**
```javascript
// No Console do navegador
localStorage.setItem('admin_token', 'TOKEN_AQUI')
location.href = '/admin/dashboard'
```

---

**Status:** 🔍 Em investigação - Melhorias aplicadas, aguardando teste

