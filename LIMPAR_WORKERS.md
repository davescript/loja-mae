# 🗑️ Limpar Workers do Cloudflare

## 📋 Análise dos Workers

### ✅ MANTER (NÃO APAGAR)

#### **loja-mae-api** ⚠️ PRINCIPAL
- **Status**: `api.leiasabores.pt/*` (ATIVO)
- **Requests**: 9
- **Response time**: 0.4 ms
- **Bindings**: 2 (DB, R2)
- **Última atividade**: 6m atrás
- **Motivo**: Este é o Worker principal da API, está funcionando e recebendo requests

### ❌ PODE APAGAR

#### **loja-mae-api-production**
- **Status**: "No production routes"
- **Bindings**: 0
- **Última atividade**: 18m atrás
- **Motivo**: Foi criado acidentalmente quando configuramos o secret `ALLOWED_ORIGINS`. Não é necessário.

#### **loja-mae-db**
- **Status**: "No production routes"
- **Bindings**: 0
- **Última atividade**: 10h atrás
- **Motivo**: Worker antigo ou não utilizado. O banco D1 é um binding, não um Worker separado.

### ⚠️ AVALIAR

#### **loja-mae-frontend**
- **Status**: "No production routes"
- **Bindings**: 2
- **Última atividade**: 6m atrás
- **Motivo**: Pode ser usado para deploy do frontend via Cloudflare Pages. Se não for usar, pode apagar.

## 🎯 Recomendação

### Apagar Agora:
1. ✅ **loja-mae-api-production** - Criado acidentalmente
2. ✅ **loja-mae-db** - Não utilizado

### Manter:
1. ✅ **loja-mae-api** - Worker principal (NÃO APAGAR!)

### Decidir:
1. ⚠️ **loja-mae-frontend** - Se for usar Cloudflare Pages para frontend, manter. Caso contrário, apagar.

## 🗑️ Como Apagar

### Via Dashboard:
1. Acesse: https://dash.cloudflare.com/55b0027975cda6f67a48ea231d2cef8d/workers
2. Clique no Worker que deseja apagar
3. Vá em **Settings** → **Delete Worker**
4. Confirme a exclusão

### Via Wrangler CLI:
```bash
# Apagar loja-mae-api-production
npx wrangler delete loja-mae-api-production

# Apagar loja-mae-db
npx wrangler delete loja-mae-db

# Apagar loja-mae-frontend (se não for usar)
npx wrangler delete loja-mae-frontend
```

## ⚠️ Atenção

**NÃO APAGUE o `loja-mae-api`** - Este é o Worker principal que está funcionando e recebendo requests em produção!

---

**Status**: ✅ Pronto para limpar Workers desnecessários
**Próximo passo**: Apagar `loja-mae-api-production` e `loja-mae-db`

