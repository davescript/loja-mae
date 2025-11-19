# Configurar Login com Google OAuth

## Credenciais Configuradas

- **Client ID**: `1006277981048-p2thqth4k2u76f81f3cfj433jka6n6dt.apps.googleusercontent.com`
- **Client Secret**: `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` ✅ Configurado no Cloudflare Workers

## URIs de Redirecionamento Necessárias ⚠️ **IMPORTANTE**

No Google Cloud Console, você **DEVE** adicionar a seguinte URI de redirecionamento autorizada:

### Para Produção (leiasabores.pt) - **OBRIGATÓRIA**:
```
https://api.leiasabores.pt/api/auth/oauth/google/callback
```

### Para Desenvolvimento (workers.dev) - **OBRIGATÓRIA**:
```
https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback
```

### Para Desenvolvimento Local (opcional):
```
http://localhost:8787/api/auth/oauth/google/callback
```

**Nota**: O código agora sempre usa `api.leiasabores.pt` para o callback, mesmo quando a requisição vem de `www.leiasabores.pt`. Isso garante que a URI seja sempre consistente.

## Como Adicionar URIs no Google Cloud Console

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no seu cliente OAuth criado
3. Em **"URIs de redirecionamento autorizados"**, clique em **"+ Adicionar URI"**
4. Adicione cada uma das URIs acima
5. Clique em **"Salvar"**

## Origens JavaScript Autorizadas

Também adicione as seguintes origens JavaScript autorizadas:

### Para Produção:
```
https://www.leiasabores.pt
https://leiasabores.pt
https://api.leiasabores.pt
```

### Para Desenvolvimento:
```
https://loja-mae-api.davecdl.workers.dev
https://loja-mae.davecdl.pages.dev
```

## Testando o Login

Após configurar as URIs:

1. Acesse: `https://www.leiasabores.pt/login`
2. Clique no botão **"Continuar com Google"**
3. Você será redirecionado para o Google para autorizar
4. Após autorizar, será redirecionado de volta e estará logado

## Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se todas as URIs de redirecionamento estão adicionadas no Google Cloud Console
- Certifique-se de que a URI está exatamente igual (incluindo https/http)

### Erro: "Google OAuth not configured"
- Verifique se as secrets `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão configuradas no Cloudflare Workers
- Execute: `npx wrangler secret put GOOGLE_CLIENT_ID` e `npx wrangler secret put GOOGLE_CLIENT_SECRET`

### Cookies não funcionam após login
- Verifique se o domínio está configurado corretamente
- Para `leiasabores.pt`, os cookies devem usar `Domain=.leiasabores.pt`

