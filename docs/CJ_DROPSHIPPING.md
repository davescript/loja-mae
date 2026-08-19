# CJ Dropshipping Integration

Esta integração adiciona a camada de fornecedor CJ sem alterar ainda o checkout.
O fluxo inicial é: configurar chave CJ, aplicar migration, pesquisar produtos CJ no admin,
importar como rascunho e sincronizar stock.

## Secrets

Configure localmente em `.dev.vars` e em produção com `wrangler secret put`:

```bash
CJ_API_KEY=CJUserNum@api@...
CJ_PLATFORM_TOKEN=
CJ_API_BASE_URL=https://developers.cjdropshipping.com/api2.0/v1
CJ_DEFAULT_WAREHOUSE_COUNTRY=PT
```

`CJ_PLATFORM_TOKEN` pode ficar vazio salvo se a CJ o exigir para a tua conta.

## Migration

```bash
wrangler d1 migrations apply loja-mae-db --local
wrangler d1 migrations apply loja-mae-db --remote
```

A migration criada é `migrations/0019_cj_dropshipping.sql`.

## Admin API

Todos os endpoints exigem token admin.

```http
GET /api/admin/dropshipping/cj/status
GET /api/admin/dropshipping/cj/status?verify=1
GET /api/admin/dropshipping/cj/search?keyword=coffee&page=1&pageSize=20
GET /api/admin/dropshipping/cj/products/:cjProductId
POST /api/admin/dropshipping/cj/import
POST /api/admin/dropshipping/cj/sync-stock
GET /api/admin/dropshipping/cj/logs
```

Exemplo de import:

```json
{
  "cjProductId": "123456789",
  "markupPercent": 70,
  "status": "draft",
  "preferredCountryCode": "PT"
}
```

O produto entra como rascunho para revisão de título, imagens, preço, stock e prazo
antes de publicar.

## Próximo passo

Depois de validarmos importação e stock com uma chave CJ real, o próximo passo é ligar
o webhook Stripe `payment_intent.succeeded` ao fulfillment: criar `fulfillments`,
enviar o pedido para CJ com `payType=3`, guardar `cj_order_id` e atualizar tracking.
