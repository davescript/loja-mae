# Debug do Google OAuth

## Como Verificar Qual URI Está Sendo Enviada

### Método 1: Verificar nos Logs do Cloudflare

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Workers & Pages** > **loja-mae-api** > **Logs**
3. Clique em "Continuar com Google" na página de login
4. Procure por: `[OAUTH] Google OAuth iniciado:`
5. Veja qual `redirectUri` está sendo enviada

### Método 2: Verificar no Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Clique em "Continuar com Google"
4. Procure pela requisição para `/api/auth/oauth/google`
5. Veja a URL completa na aba **Headers** > **Request URL**

### Método 3: Verificar a URL do Google

1. Clique em "Continuar com Google"
2. Quando for redirecionado para o Google, olhe a URL na barra de endereços
3. Procure por `redirect_uri=` na URL
4. Copie o valor após `redirect_uri=` (está codificado em URL)

## URIs que DEVEM estar no Google Cloud Console

Adicione TODAS estas URIs (não apenas uma):

```
https://api.leiasabores.pt/api/auth/oauth/google/callback
https://www.leiasabores.pt/api/auth/oauth/google/callback
https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback
```

## Verificar se Está Correto

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no cliente OAuth
3. Role até "URIs de redirecionamento autorizados"
4. Você deve ver TODAS as 3 URIs acima na lista

## Se Ainda Não Funcionar

1. **Aguarde alguns minutos** - O Google pode levar até 1 hora para propagar mudanças
2. **Limpe o cache do navegador** - Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
3. **Teste em aba anônima** - Para evitar cache
4. **Verifique se não há espaços** na URI no Google Cloud Console
5. **Verifique se está usando HTTPS** (não HTTP)

## Erro Comum: redirect_uri_mismatch

Se ainda der esse erro:
- A URI que está sendo enviada NÃO está na lista do Google Cloud Console
- Verifique nos logs qual URI está sendo enviada
- Adicione essa URI exata no Google Cloud Console

