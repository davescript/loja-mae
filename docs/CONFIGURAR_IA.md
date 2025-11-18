# 🤖 Configurar IA Real no Chat

## 📋 Pré-requisitos

1. Conta no OpenAI: https://platform.openai.com/
2. API Key do OpenAI

## 🔑 Como Obter a API Key

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em "Create new secret key"
4. Copie a chave (ela só aparece uma vez!)

## ⚙️ Configuração

### Opção 1: Via Wrangler Secret (Recomendado para Produção)

```bash
# Para produção
echo "sua-api-key-aqui" | npx wrangler secret put OPENAI_API_KEY --name loja-mae-api

# Para desenvolvimento
echo "sua-api-key-aqui" | npx wrangler secret put OPENAI_API_KEY --name loja-mae-api-dev
```

### Opção 2: Via .dev.vars (Apenas para Desenvolvimento Local)

Adicione no arquivo `.dev.vars`:

```env
OPENAI_API_KEY=sk-sua-api-key-aqui
```

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.dev.vars` no Git!

## 🧪 Testar

1. Inicie o servidor local:
   ```bash
   npm run dev:backend
   ```

2. Teste a API:
   ```bash
   curl -X POST http://localhost:8787/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Olá, quais produtos vocês têm?"}'
   ```

3. Verifique se a resposta vem de "openai" no campo `source`

## 💰 Custos

O chat usa o modelo `gpt-4o-mini` que é:
- ✅ Rápido
- ✅ Econômico
- ✅ Boa qualidade de respostas

**Custo aproximado:** ~$0.15 por 1 milhão de tokens de entrada e ~$0.60 por 1 milhão de tokens de saída.

Para uma conversa típica de 10 mensagens: ~$0.001 (menos de 1 centavo)

## 🔄 Fallback Automático

Se a API Key não estiver configurada ou houver erro, o sistema automaticamente usa respostas baseadas em palavras-chave (gratuito).

## 🛡️ Segurança

- ✅ API Key armazenada como secret (não exposta no código)
- ✅ Validação de entrada
- ✅ Limite de tokens para controlar custos
- ✅ Tratamento de erros robusto

## 📊 Monitoramento

Para monitorar uso e custos:
1. Acesse: https://platform.openai.com/usage
2. Veja estatísticas de uso da API
3. Configure limites de gastos se necessário

## 🆘 Troubleshooting

### Erro: "OpenAI API error: 401"
- Verifique se a API Key está correta
- Verifique se a chave não expirou

### Erro: "OpenAI API error: 429"
- Você atingiu o limite de rate limit
- Aguarde alguns minutos ou verifique seu plano

### Erro: "OpenAI API error: 500"
- Erro temporário do OpenAI
- O sistema automaticamente usa fallback

### Chat não está usando IA
- Verifique se o secret está configurado: `npx wrangler secret list`
- Verifique os logs do Worker para erros
- O sistema usa fallback silenciosamente se houver erro

---

**Status:** ✅ Pronto para uso após configurar a API Key

