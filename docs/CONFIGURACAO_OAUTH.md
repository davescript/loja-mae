# Configuração OAuth - Google e Apple

## 📋 Visão Geral

O sistema agora suporta autenticação OAuth com Google e Apple, permitindo que usuários façam login ou criem contas usando suas contas sociais.

---

## 🔧 Configuração do Google OAuth

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**

### 2. Configurar OAuth Consent Screen

1. Vá para **OAuth consent screen**
2. Escolha **External** (para testes) ou **Internal** (para produção)
3. Preencha:
   - App name: "Loja Mãe"
   - User support email: seu email
   - Developer contact: seu email
4. Adicione scopes: `email`, `profile`, `openid`
5. Adicione test users (se em modo External)

### 3. Criar OAuth Client ID

1. Tipo: **Web application**
2. Name: "Loja Mãe Web"
3. **Authorized JavaScript origins:**
   - `https://www.leiasabores.pt`
   - `https://loja-mae-api.davecdl.workers.dev`
4. **Authorized redirect URIs:**
   - `https://www.leiasabores.pt/api/auth/oauth/google/callback`
   - `https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback`

### 4. Obter Credenciais

- **Client ID**: Copie o Client ID gerado
- **Client Secret**: Copie o Client Secret gerado

### 5. Configurar Variáveis de Ambiente

No Cloudflare Workers, adicione as seguintes variáveis de ambiente:

```bash
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
```

---

## 🍎 Configuração do Apple OAuth

### 1. Criar App ID no Apple Developer

1. Acesse [Apple Developer Portal](https://developer.apple.com/)
2. Vá para **Certificates, Identifiers & Profiles**
3. Crie um novo **App ID** ou use um existente
4. Habilite **Sign in with Apple**

### 2. Criar Service ID

1. Vá para **Identifiers** > **Services IDs**
2. Crie um novo Service ID
3. Configure:
   - **Description**: "Loja Mãe Web"
   - **Return URLs**:
     - `https://www.leiasabores.pt/api/auth/oauth/apple/callback`
     - `https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/apple/callback`

### 3. Criar Key para Sign in with Apple

1. Vá para **Keys**
2. Crie uma nova key
3. Habilite **Sign in with Apple**
4. Baixe o arquivo `.p8` (você só poderá baixar uma vez!)
5. Anote o **Key ID**

### 4. Obter Credenciais

- **Client ID (Service ID)**: O Service ID criado
- **Team ID**: Seu Team ID (encontrado no canto superior direito)
- **Key ID**: O Key ID da key criada
- **Private Key**: Conteúdo do arquivo `.p8`

### 5. Configurar Variáveis de Ambiente

No Cloudflare Workers, adicione:

```bash
APPLE_CLIENT_ID=seu-service-id-aqui
APPLE_TEAM_ID=seu-team-id-aqui
APPLE_KEY_ID=seu-key-id-aqui
APPLE_PRIVATE_KEY=conteudo-do-arquivo-p8-aqui
```

**Nota:** O Apple OAuth requer configuração adicional de JWT. A implementação atual retorna um erro 501 indicando que precisa ser configurado. Para produção, será necessário implementar a geração de JWT para autenticação com Apple.

---

## 🚀 Como Funciona

### Fluxo OAuth

1. **Usuário clica em "Google" ou "Apple"**
   - Frontend redireciona para `/api/auth/oauth/{provider}?redirect=/checkout`

2. **Backend inicia OAuth**
   - Gera URL de autorização do provedor
   - Redireciona usuário para página de login do provedor

3. **Usuário autoriza**
   - Provedor redireciona de volta para `/api/auth/oauth/{provider}/callback?code=...&state=...`

4. **Backend processa callback**
   - Troca código por access token
   - Obtém informações do usuário (email, nome)
   - Cria ou encontra cliente no banco
   - Cria sessão e define cookies
   - Redireciona para URL original (ex: `/checkout`)

### Segurança

- ✅ State parameter para prevenir CSRF
- ✅ Verificação de assinatura do webhook
- ✅ Tokens armazenados de forma segura
- ✅ Cookies HttpOnly e Secure

---

## 📝 Notas Importantes

### Google OAuth
- ✅ **Totalmente funcional** após configuração
- ✅ Suporta criação automática de conta
- ✅ Retorna email, nome e sobrenome

### Apple OAuth
- ⚠️ **Requer configuração adicional**
- ⚠️ Implementação atual retorna erro 501
- ⚠️ Necessário implementar geração de JWT
- ⚠️ Apple requer certificado `.p8` válido

### Recomendações

1. **Para produção:**
   - Use HTTPS em todas as URLs
   - Configure domínios corretos
   - Teste em ambiente de staging primeiro

2. **Para desenvolvimento:**
   - Use URLs do Workers Dev
   - Configure test users no Google
   - Use modo External no Google OAuth

3. **Segurança:**
   - Nunca exponha Client Secrets no frontend
   - Use variáveis de ambiente
   - Rotacione secrets periodicamente

---

## 🔍 Troubleshooting

### Erro: "Google OAuth not configured"
- Verifique se `GOOGLE_CLIENT_ID` está configurado
- Verifique se a variável está no Cloudflare Workers

### Erro: "Failed to exchange token"
- Verifique se `GOOGLE_CLIENT_SECRET` está correto
- Verifique se o redirect URI está correto no Google Console

### Erro: "Email not provided by OAuth provider"
- Google sempre fornece email
- Apple pode não fornecer email na primeira vez (requer configuração adicional)

### Erro: "Apple OAuth requires additional configuration"
- Implementação atual não suporta Apple completamente
- Use Google OAuth ou email/password para produção

---

## ✅ Checklist de Configuração

### Google OAuth
- [ ] Projeto criado no Google Cloud Console
- [ ] OAuth consent screen configurado
- [ ] OAuth Client ID criado
- [ ] Redirect URIs configurados
- [ ] `GOOGLE_CLIENT_ID` adicionado ao Workers
- [ ] `GOOGLE_CLIENT_SECRET` adicionado ao Workers
- [ ] Testado em desenvolvimento
- [ ] Testado em produção

### Apple OAuth
- [ ] App ID criado no Apple Developer
- [ ] Service ID criado
- [ ] Key criada e baixada
- [ ] Variáveis de ambiente configuradas
- [ ] JWT generation implementado (requer desenvolvimento adicional)
- [ ] Testado em desenvolvimento
- [ ] Testado em produção

---

## 📚 Recursos

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)

