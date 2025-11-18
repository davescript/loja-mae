# 📧 Configurar Secrets via Dashboard (Alternativa)

Se você não conseguir fazer login via CLI, pode configurar os secrets diretamente no Dashboard do Cloudflare.

## 🌐 Passo a Passo

1. **Acesse o Dashboard:**
   - Vá para: https://dash.cloudflare.com
   - Faça login na sua conta

2. **Navegue até Workers:**
   - No menu lateral, clique em **Workers & Pages**
   - Clique em **Workers**
   - Encontre e clique em **loja-mae-api**

3. **Configurar Secrets:**
   - Clique na aba **Settings**
   - Role até a seção **Variables and Secrets**
   - Clique em **Add variable**
   - Selecione **Secret**
   - Adicione os seguintes secrets:

   **Secret 1:**
   - Name: `FROM_EMAIL`
   - Value: `davecdl@outlook.com`
   - Environment: `production`

   **Secret 2:**
   - Name: `FROM_NAME`
   - Value: `Leia Sabores`
   - Environment: `production`

4. **Salvar:**
   - Clique em **Save**
   - Aguarde alguns segundos para propagação

## ✅ Verificar

Após configurar, você pode verificar se os secrets estão ativos:

```bash
npx wrangler secret list --env production
```

## 🔄 Deploy

Após configurar os secrets, faça deploy do Worker:

```bash
npm run deploy:backend
```

Ou via Dashboard:
- Workers → loja-mae-api → Deployments → Deploy

## 📝 Nota

Se você configurar via Dashboard, não precisa fazer login via CLI para configurar secrets. O Dashboard é uma alternativa mais visual e fácil.

