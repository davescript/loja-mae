# Teste do Login com Google OAuth

## ✅ Configuração Completa

### Credenciais Configuradas:
- ✅ Client ID: `1006277981048-p2thqth4k2u76f81f3cfj433jka6n6dt.apps.googleusercontent.com`
- ✅ Client Secret: Configurado no Cloudflare Workers
- ✅ URIs de Redirecionamento: Adicionadas no Google Cloud Console

### URIs Configuradas:
- ✅ `https://api.leiasabores.pt/api/auth/oauth/google/callback`
- ✅ `https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback`

## Como Testar

1. **Acesse a página de login:**
   ```
   https://www.leiasabores.pt/login
   ```

2. **Clique no botão "Continuar com Google"**

3. **Você será redirecionado para o Google:**
   - Escolha a conta Google que deseja usar
   - Autorize o acesso

4. **Após autorizar:**
   - Você será redirecionado de volta para `https://www.leiasabores.pt/account`
   - Estará logado automaticamente
   - Seus dados (nome, email) serão criados automaticamente se for a primeira vez

## Fluxo Completo

1. Usuário clica em "Continuar com Google" em `www.leiasabores.pt/login`
2. Frontend redireciona para `api.leiasabores.pt/api/auth/oauth/google`
3. Backend redireciona para Google OAuth com `redirect_uri=https://api.leiasabores.pt/api/auth/oauth/google/callback`
4. Google redireciona de volta para `api.leiasabores.pt/api/auth/oauth/google/callback` com código
5. Backend troca código por token e obtém dados do usuário
6. Backend cria/atualiza cliente no banco de dados
7. Backend cria sessão e define cookies
8. Backend redireciona para `www.leiasabores.pt/account` com cookies de sessão
9. Usuário está logado! 🎉

## Troubleshooting

### Se ainda der erro `redirect_uri_mismatch`:
- Verifique se a URI está EXATAMENTE igual no Google Cloud Console
- Verifique se não há espaços extras ou caracteres especiais
- Verifique se está usando `https://` (não `http://`)
- Verifique se não há barra no final: `/api/auth/oauth/google/callback` (não `/api/auth/oauth/google/callback/`)

### Se der erro "Google OAuth not configured":
- Verifique se as secrets estão configuradas: `npx wrangler secret list`
- Verifique se o Client ID e Secret estão corretos

### Se o login funcionar mas não criar sessão:
- Verifique os cookies no navegador (DevTools > Application > Cookies)
- Verifique se os cookies estão sendo definidos com `Domain=.leiasabores.pt`

## Logs para Debug

Os logs no Cloudflare Workers mostrarão:
- `[OAUTH] Google OAuth iniciado:` - mostra a redirectUri sendo enviada
- `[OAUTH] Google OAuth callback:` - mostra quando o callback é recebido

Para ver os logs:
1. Acesse: https://dash.cloudflare.com/
2. Workers & Pages > loja-mae-api > Logs

