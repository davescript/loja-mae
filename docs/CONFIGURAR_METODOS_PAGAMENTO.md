# Configurar Métodos de Pagamento no Stripe

## Problema
Apenas 2 métodos de pagamento estão aparecendo no checkout (Cartão e Klarna), mas deveriam aparecer também MB Way, Apple Pay e Google Pay.

## Solução

### 1. Habilitar Métodos no Painel do Stripe

1. Acesse o [Painel do Stripe](https://dashboard.stripe.com/)
2. Vá em **Configurações** > **Métodos de Pagamento**
3. Ative os seguintes métodos:
   - ✅ **Cartão** (já ativo)
   - ✅ **Link** (para MB Way) - Ative este método
   - ✅ **Klarna** (já ativo)
   - ✅ **Apple Pay** - Ative e configure verificação de domínio
   - ✅ **Google Pay** - Ative

### 2. Verificar Configuração do Link (MB Way)

O MB Way aparece através do método **Link** do Stripe quando:
- O país do endereço de entrega é **PT** (Portugal) ✅ **Código já garante isso**
- O método **Link** está habilitado no painel do Stripe ⚠️ **VERIFICAR NO PAINEL**
- O valor do pedido é compatível
- A moeda é **EUR** ✅ **Já configurado**

**IMPORTANTE**: O código agora garante que o país seja sempre 'PT' se não for especificado, e adiciona o país no shipping address do Payment Intent. Se o MB Way ainda não aparecer, verifique se o método **Link** está habilitado no painel do Stripe.

### 3. Configurar Apple Pay

Para que o Apple Pay apareça:

1. No painel do Stripe, vá em **Configurações** > **Métodos de Pagamento** > **Apple Pay**
2. Adicione e verifique seu domínio (`www.leiasabores.pt` e `leiasabores.pt`)
3. Faça o upload do arquivo de verificação fornecido pelo Stripe
4. Aguarde a verificação (pode levar alguns minutos)

### 4. Configurar Google Pay

O Google Pay geralmente funciona automaticamente quando:
- O método está habilitado no painel do Stripe
- O cliente está usando um dispositivo/navegador compatível
- O domínio está configurado corretamente

### 5. Verificar Disponibilidade por País/Moeda

Alguns métodos têm restrições:
- **MB Way (Link)**: Disponível principalmente em Portugal
- **Klarna**: Disponível em países específicos da Europa
- **Apple Pay/Google Pay**: Dependem do dispositivo e navegador do cliente

## Código Configurado

O código já está configurado para mostrar todos os métodos:

**Backend** (`backend/api/stripe/create-intent.ts`):
```typescript
payment_method_types: ['card', 'link', 'klarna']
```

**Frontend** (`frontend/storefront/pages/checkout.tsx`):
```typescript
wallets: {
  applePay: 'auto',
  googlePay: 'auto',
}
```

## Teste

Após habilitar os métodos no painel do Stripe:

1. Teste em um dispositivo Apple com Safari para ver Apple Pay
2. Teste em um dispositivo Android para ver Google Pay
3. Teste com endereço em Portugal para ver MB Way (Link)
4. Verifique se Klarna aparece (pode ter restrições de valor mínimo)

## Notas Importantes

- **Apple Pay e Google Pay** só aparecem em dispositivos compatíveis
- **MB Way** só aparece quando o país é PT e o Link está habilitado
- **Klarna** pode ter restrições de valor mínimo ou país
- Todos os métodos precisam estar **habilitados no painel do Stripe** para aparecerem

