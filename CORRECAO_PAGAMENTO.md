# 🔧 Correção: Método de Pagamento Recusado

## ❌ Problema

O erro "O seu método de pagamento foi recusado" ocorria porque:

1. **Métodos de pagamento não configurados**: O Payment Intent estava usando `automatic_payment_methods: { enabled: true }`, que permite Klarna, Bancontact, Amazon Pay, EPS, etc., mas esses métodos podem não estar habilitados na conta Stripe.

2. **Requisitos específicos**: Alguns métodos têm requisitos adicionais (valor mínimo, país, etc.) que não estavam sendo atendidos.

## ✅ Solução Aplicada

### Backend (`create-intent.ts`)

1. **Limitar para apenas cartão**: Mudado de `automatic_payment_methods` para `payment_method_types: ['card']`
   - Cartão é o método mais básico e sempre disponível
   - Evita problemas com métodos não configurados

2. **Validação de valor mínimo**: Adicionada validação para garantir mínimo de €0,50 (50 centavos)

3. **Configurações melhoradas**: Adicionado `confirmation_method: 'automatic'` para melhor compatibilidade

### Frontend (`checkout.tsx`)

1. **Tratamento de erros melhorado**: Mensagens de erro mais específicas e claras
   - Diferencia entre tipos de erro (card_error, validation_error, etc.)
   - Mensagens específicas por código de erro (card_declined, insufficient_funds, etc.)

2. **Logs detalhados**: Adicionados logs no console para facilitar debug

## 🧪 Testar Agora

1. **Acesse o checkout**: https://www.leiasabores.pt/checkout
2. **Adicione produtos** ao carrinho (se ainda não tiver)
3. **Preencha os dados do cartão**:
   - Use um cartão de teste do Stripe (se em modo test)
   - Ou use um cartão real (se em modo live)
4. **Tente pagar**: O erro não deve mais aparecer

## 📋 Cartões de Teste (Modo Test)

Se estiver usando chaves de teste (`sk_test_...`), use:

- **Sucesso**: `4242 4242 4242 4242`
- **Recusado**: `4000 0000 0000 0002`
- **Fundos insuficientes**: `4000 0000 0000 9995`

Data: qualquer data futura  
CVC: qualquer 3 dígitos

## 🔍 Se Ainda Der Erro

1. **Verifique o console do navegador** para ver o erro específico
2. **Verifique os logs do backend** (Cloudflare Workers logs)
3. **Verifique se a conta Stripe está completa**:
   - Dados bancários configurados
   - Verificação de identidade concluída
   - Métodos de pagamento habilitados

## 🎯 Próximos Passos

Se quiser habilitar outros métodos de pagamento (Klarna, Bancontact, etc.):

1. Configure-os no Dashboard do Stripe
2. Ative-os no código alterando:
   ```typescript
   payment_method_types: ['card', 'klarna', 'bancontact', ...]
   ```
3. Ou use `automatic_payment_methods: { enabled: true }` novamente

## ✅ Status

- ✅ Backend atualizado para usar apenas cartão
- ✅ Frontend com tratamento de erros melhorado
- ✅ Validação de valor mínimo adicionada
- ✅ Pronto para testar!

