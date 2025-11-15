# 🎛️ Como Ajustar os Limites do Sistema

## Guia Prático e Simples

Este guia ensina como ajustar os limites do sistema **sem precisar entender código**.

---

## 📍 Onde Estão os Limites?

**Arquivo:** `backend/config/limits.ts` ou `limits.example.ts`

---

## 🚀 Passo a Passo

### 1. Abra o Arquivo

```bash
# Abrir no seu editor favorito
code backend/config/limits.ts

# OU
nano backend/config/limits.ts
```

### 2. Encontre o Que Quer Mudar

Use `Ctrl+F` (ou `Cmd+F` no Mac) e procure:

- **"Rate Limiting"** → Limites de requisições
- **"QUEUE"** → Filas
- **"CRON"** → Tarefas agendadas
- **"RECURSION"** → Proteção contra loops
- **"PDF"** → Geração de PDFs
- **"DEGRADED"** → Modo degradado
- **"MONITORING"** → Alertas

### 3. Mude o Valor

Procure por `// 👈 AJUSTE AQUI` - esses são os valores que você pode mudar!

**Exemplo:**

```typescript
// ANTES
MAX_REQUESTS: 60,    // 60 requisições por minuto

// DEPOIS (permitir mais)
MAX_REQUESTS: 120,   // 120 requisições por minuto
```

### 4. Salve e Faça Redeploy

```bash
# Fazer commit
git add backend/config/limits.ts
git commit -m "Ajustado limite de requisições"
git push

# Fazer deploy
cd backend
wrangler deploy
```

---

## 🎯 Cenários Comuns

### "Muitos clientes estão sendo bloqueados"

**Problema:** Rate limit muito baixo

**Solução:**

```typescript
RATE_LIMIT: {
  CUSTOMER: {
    MAX_REQUESTS: 1200,  // Era 600, agora é 1200
  }
}
```

### "A fila está acumulando muito"

**Problema:** Processamento muito lento

**Solução:**

```typescript
QUEUE: {
  MAX_JOBS_PER_MINUTE: 200,  // Era 100, agora é 200
}
```

**⚠️ Atenção:** Isso vai processar mais rápido mas pode custar um pouco mais!

### "Quero economizar ao máximo"

**Solução:**

```typescript
QUEUE: {
  MAX_JOBS_PER_MINUTE: 50,  // Reduzir de 100 para 50
}

CRON: {
  SYNC_TRACKING: {
    INTERVAL_MINUTES: 30,    // Aumentar de 15 para 30
  }
}
```

### "Clientes reclamando que site está lento"

**Problema:** Modo degradado ativando muito cedo

**Solução:**

```typescript
DEGRADED_MODE: {
  TRIGGERS: {
    AVERAGE_RESPONSE_TIME_MS: 5000,  // Era 3000, agora 5000
    QUEUE_SIZE: 12000,                // Era 8000, agora 12000
  }
}
```

### "Admins precisam gerar muitos relatórios"

**Solução:**

```typescript
FILE_GENERATION: {
  PDF: {
    MAX_PER_HOUR: 100,  // Era 50, agora 100
  }
}
```

---

## 📊 Tabela de Referência Rápida

| O Que                | Onde Encontrar      | Valor Padrão | Conservador | Agressivo |
|----------------------|---------------------|--------------|-------------|-----------|
| Req/min por IP       | `RATE_LIMIT.IP`     | 60           | 30          | 120       |
| Req/hora Customer    | `RATE_LIMIT.CUSTOMER` | 600        | 300         | 1200      |
| Jobs/min na Fila     | `QUEUE.MAX_JOBS`    | 100          | 50          | 200       |
| Sync Tracking        | `CRON.SYNC_TRACKING`| 15min        | 30min       | 10min     |
| PDFs/hora            | `PDF.MAX_PER_HOUR`  | 50           | 25          | 100       |
| Trigger Degradado    | `DEGRADED.QUEUE`    | 8000         | 5000        | 12000     |

---

## 💡 Dicas Importantes

### ✅ O Que Fazer

1. **Comece com valores padrão**
   - Já estão otimizados para a maioria dos casos

2. **Monitore por 1 semana**
   - Veja os logs para identificar gargalos

3. **Ajuste gradualmente**
   - Aumente 20-50% por vez

4. **Documente mudanças**
   - Anote por que mudou cada valor

### ❌ O Que NÃO Fazer

1. **Não remova limites completamente**
   - Sempre tenha algum limite (proteção)

2. **Não dobre valores de uma vez**
   - Pode gerar custo inesperado

3. **Não ignore alertas**
   - Se está alertando, tem um motivo

4. **Não mude em produção sem testar**
   - Teste em staging primeiro

---

## 🔍 Como Saber Se Precisa Ajustar?

### Sinais de que Rate Limit está muito baixo:

- ✉️ Clientes reclamando de "Too Many Requests"
- 📊 Muitos HTTP 429 nos logs
- 📈 Taxa de erro > 5%

**Solução:** Aumente `MAX_REQUESTS` em 50%

### Sinais de que Fila está lenta:

- ⏰ Jobs demorando muito para processar
- 📦 Fila crescendo constantemente
- ⚠️ Modo degradado ativando frequentemente

**Solução:** Aumente `MAX_JOBS_PER_MINUTE`

### Sinais de que está gastando muito:

- 💸 Fatura Cloudflare aumentando
- 📊 Muitas operações nos logs
- 🔄 CRONs rodando demais

**Solução:** 
- Reduza `MAX_JOBS_PER_MINUTE`
- Aumente `INTERVAL_MINUTES` dos CRONs

---

## 📞 Precisa de Ajuda?

### Logs para Verificar

```bash
# Ver logs do Worker
wrangler tail

# Ver últimos erros
wrangler tail --format json | grep error
```

### O Que Procurar nos Logs

```
[RATE_LIMIT] Rate limit exceeded    → Aumentar rate limit
[QUEUE] Queue size: 9000            → Aumentar processamento
[DEGRADED_MODE] ACTIVATING          → Sistema sob carga
[RECURSION_GUARD] Max depth         → Loop detectado (ok)
```

---

## 🎓 Presets Prontos

Não quer ajustar manualmente? Use um preset:

### PRESET: Startup (Menor Custo)

```bash
# Copiar preset conservador
cp backend/config/presets/conservative.ts backend/config/limits.ts
```

Ideal para:
- Começando o negócio
- Poucos pedidos/dia
- Quer gastar mínimo

### PRESET: Balanceado (Recomendado)

```bash
# Já é o padrão!
# Não precisa fazer nada
```

Ideal para:
- 100-1000 pedidos/mês
- Tráfego normal
- Bom custo-benefício

### PRESET: Alto Tráfego

```bash
# Copiar preset agressivo
cp backend/config/presets/aggressive.ts backend/config/limits.ts
```

Ideal para:
- 1000+ pedidos/mês
- Muito tráfego
- Performance > Custo

---

## ✅ Checklist Antes de Mudar em Produção

- [ ] Testei em ambiente local/staging
- [ ] Documentei o por quê da mudança
- [ ] Aumentei/diminuí gradualment (não dobrei)
- [ ] Avisei a equipe da mudança
- [ ] Tenho como reverter se der problema
- [ ] Vou monitorar os logs após deploy

---

## 🚨 Reverter Mudanças

Se algo der errado após mudar os limites:

```bash
# Ver commit anterior
git log --oneline | head -5

# Reverter para commit anterior
git revert HEAD

# Fazer redeploy
cd backend && wrangler deploy
```

---

**Lembre-se:** É melhor começar conservador e aumentar aos poucos do que ter surpresas na fatura! 💰

