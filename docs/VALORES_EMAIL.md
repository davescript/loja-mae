# 📧 Valores de Email Configurados

## Valores Definidos

- **FROM_EMAIL**: `davecdl@outlook.com`
- **FROM_NAME**: `Leia Sabores`

## Como Configurar

### Após fazer login no Wrangler:

```bash
# Opção 1: Script automatizado
./scripts/configurar-email-valores.sh

# Opção 2: Manual
echo "davecdl@outlook.com" | npx wrangler secret put FROM_EMAIL --env production
echo "Leia Sabores" | npx wrangler secret put FROM_NAME --env production
```

## Verificar Configuração

```bash
npx wrangler secret list --env production
```

Você deve ver:
- `FROM_EMAIL`
- `FROM_NAME`

## Importante sobre Email Outlook

⚠️ **Atenção**: O email `davecdl@outlook.com` é um email pessoal do Outlook. Para produção, recomenda-se:

1. **Usar email do domínio** (melhor para evitar spam):
   - `noreply@leiasabores.pt`
   - `contato@leiasabores.pt`

2. **Ou configurar SPF/DKIM** no domínio para melhorar a entrega

3. **MailChannels** (serviço usado) funciona melhor com emails de domínio próprio

## Configuração Alternativa (Recomendada)

Se você tiver acesso ao domínio `leiasabores.pt`, use:

```bash
echo "noreply@leiasabores.pt" | npx wrangler secret put FROM_EMAIL --env production
echo "Leia Sabores" | npx wrangler secret put FROM_NAME --env production
```

Isso melhora a taxa de entrega e reduz a chance de emails caírem em spam.

