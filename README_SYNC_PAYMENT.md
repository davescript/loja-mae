# 🔧 Como Sincronizar Status de Pagamento Manualmente

## Problema
Se um pagamento foi feito mas o status ainda aparece como "pendente" no admin, você pode sincronizar manualmente.

## Solução 1: Via Admin (Recomendado)
1. Acesse `/admin/orders`
2. Encontre o pedido pendente
3. Clique no botão de **sincronização** (ícone de refresh) ao lado do pedido
4. O status será atualizado automaticamente verificando no Stripe

## Solução 2: Via API
```bash
curl -X POST "https://api.leiasabores.pt/api/orders/sync-payment?order_number=ORD-XXXXX&payment_intent_id=pi_XXXXX" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Solução 3: Via SQL (Apenas se necessário)
Execute o script `scripts/sync-last-payment.sql` para ver pedidos pendentes e atualizar manualmente.

## Prevenção
O sistema agora:
- ✅ Sincroniza automaticamente após pagamento bem-sucedido
- ✅ Atualiza a cada 30 segundos no admin
- ✅ Tem botão de sincronização manual em cada pedido
- ✅ Verifica status diretamente no Stripe

