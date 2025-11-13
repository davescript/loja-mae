# 🧪 PLANO DE TESTES AUTOMATIZADOS

## Estrutura de Testes Recomendada

### 1. Testes Unitários (Jest + React Testing Library)

**Arquivos a testar:**
- `frontend/utils/api.ts` - Cliente HTTP
- `frontend/utils/format.ts` - Formatação de preços
- `frontend/utils/sanitize.ts` - Sanitização XSS
- `frontend/utils/validateImage.ts` - Validação de imagens
- `frontend/utils/validateDates.ts` - Validação de datas
- `backend/utils/db.ts` - Funções de banco
- `backend/utils/auth.ts` - Autenticação
- `backend/validators/*.ts` - Validadores Zod

### 2. Testes de Integração (Vitest)

**Cenários:**
- Login admin → Acesso ao dashboard
- Criar produto → Verificar no banco → Verificar na listagem
- Upload de imagem → Verificar no R2 → Verificar URL
- Criar pedido → Webhook Stripe → Atualização de status

### 3. Testes E2E (Playwright)

**Fluxos críticos:**
1. Compra completa (homepage → produto → carrinho → checkout → pagamento)
2. Gestão de produto (login admin → criar → editar → deletar)
3. Gestão de pedido (criar pedido → atualizar status → verificar timeline)

### 4. Testes de Segurança (OWASP ZAP / Burp Suite)

**Vulnerabilidades a testar:**
- SQL Injection em todos os endpoints
- XSS em todos os campos de input
- CSRF em todas as rotas mutáveis
- IDOR em endpoints de recursos
- Rate limiting

### 5. Testes de Performance (k6)

**Cenários de carga:**
- 100 usuários simultâneos navegando
- 50 usuários fazendo checkout simultaneamente
- 10 admins gerenciando produtos simultaneamente
- Stress test: 1000 requisições/segundo

---

## Scripts de Teste Recomendados

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:security": "npm run test:owasp",
    "test:performance": "k6 run tests/performance/load.js"
  }
}
```

---

## Checklist de Cobertura

- [ ] 80%+ cobertura de código
- [ ] Todos os endpoints da API testados
- [ ] Todos os componentes críticos testados
- [ ] Fluxos E2E principais testados
- [ ] Testes de segurança executados
- [ ] Testes de performance executados

---

*Documento gerado em 13/11/2025*

