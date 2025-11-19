# URIs que DEVEM estar no Google Cloud Console

## ⚠️ IMPORTANTE: Adicione EXATAMENTE estas URIs

No Google Cloud Console (https://console.cloud.google.com/apis/credentials), no seu cliente OAuth, adicione estas URIs de redirecionamento:

### 1. Para Produção (OBRIGATÓRIA):
```
https://api.leiasabores.pt/api/auth/oauth/google/callback
```

### 2. Para Desenvolvimento (OBRIGATÓRIA):
```
https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback
```

## Como Adicionar

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no cliente OAuth: `1006277981048-p2thqth4k2u76f81f3cfj433jka6n6dt`
3. Role até **"URIs de redirecionamento autorizados"**
4. Clique em **"+ Adicionar URI"**
5. Cole EXATAMENTE: `https://api.leiasabores.pt/api/auth/oauth/google/callback`
6. Clique em **"+ Adicionar URI"** novamente
7. Cole EXATAMENTE: `https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback`
8. Clique em **"Salvar"** (no final da página)

## Verificar se está Correto

Após adicionar, você deve ver na lista:
- ✅ `https://api.leiasabores.pt/api/auth/oauth/google/callback`
- ✅ `https://loja-mae-api.davecdl.workers.dev/api/auth/oauth/google/callback`

## Origens JavaScript Autorizadas

Também adicione estas origens:

```
https://www.leiasabores.pt
https://leiasabores.pt
https://api.leiasabores.pt
https://loja-mae-api.davecdl.workers.dev
```

## Teste

Após adicionar as URIs:
1. Acesse: `https://www.leiasabores.pt/login`
2. Clique em "Continuar com Google"
3. O erro `redirect_uri_mismatch` NÃO deve mais aparecer

## Se ainda der erro

Verifique nos logs do Cloudflare Workers qual URI está sendo enviada. A URI deve ser EXATAMENTE uma das que você adicionou acima.

