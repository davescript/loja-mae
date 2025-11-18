# 📧 Configuração de Email

Este guia explica como configurar o sistema de envio de emails do e-commerce.

## 🔧 Configuração dos Secrets

O sistema usa **MailChannels** (gratuito para Cloudflare Workers) para envio de emails. Você precisa configurar dois secrets:

### Opção 1: Usar o Script Automatizado

```bash
./scripts/configurar-secrets-email.sh
```

### Opção 2: Configuração Manual

```bash
# Configurar email remetente
echo "noreply@leiasabores.pt" | npx wrangler secret put FROM_EMAIL --env production

# Configurar nome do remetente
echo "Loja Mãe" | npx wrangler secret put FROM_NAME --env production
```

## 📋 Valores Recomendados

- **FROM_EMAIL**: `noreply@leiasabores.pt` ou `contato@leiasabores.pt`
- **FROM_NAME**: `Loja Mãe` ou `Leia Sabores`

## ⚠️ Importante: Configuração DKIM (Opcional mas Recomendado)

Para garantir que os emails não caiam em spam, configure DKIM no seu domínio:

1. Acesse o DNS do seu domínio (Cloudflare Dashboard)
2. Adicione um registro TXT:
   - **Nome**: `_mailchannels.leiasabores.pt`
   - **Conteúdo**: `v=mc1;`

3. Adicione outro registro TXT:
   - **Nome**: `_dmarc.leiasabores.pt`
   - **Conteúdo**: `v=DMARC1; p=none; rua=mailto:postmaster@leiasabores.pt`

## ✅ Verificar Configuração

Após configurar, você pode testar enviando um pedido de teste. O email será enviado automaticamente quando:

1. Um pagamento for confirmado via webhook Stripe
2. O pedido tiver status "pago"

## 🧪 Testar Localmente

Para testar emails localmente, adicione no `.dev.vars`:

```env
FROM_EMAIL=noreply@leiasabores.pt
FROM_NAME=Loja Mãe
```

## 📝 Templates de Email

Os templates de email estão em `backend/utils/email.ts` e podem ser personalizados conforme necessário.

## 🔍 Troubleshooting

### Emails não estão sendo enviados

1. Verifique se os secrets estão configurados:
   ```bash
   npx wrangler secret list --env production
   ```

2. Verifique os logs do Worker:
   ```bash
   npx wrangler tail --env production
   ```

3. Verifique se o webhook Stripe está funcionando corretamente

### Emails caindo em spam

- Configure DKIM (veja acima)
- Use um email do seu domínio (não Gmail/Outlook)
- Evite palavras como "promoção", "grátis" no assunto

