# E2E Tests

Testes end-to-end para o e-commerce usando Playwright.

## Instalação

```bash
npm install -D @playwright/test
npx playwright install
```

## Configuração

Crie um arquivo `.env.test` ou configure as variáveis de ambiente:

```env
E2E_BASE_URL=http://localhost:5173
E2E_API_URL=http://localhost:8787
```

## Executar Testes

```bash
# Executar todos os testes
npx playwright test

# Executar em modo UI (recomendado para desenvolvimento)
npx playwright test --ui

# Executar testes específicos
npx playwright test checkout.spec.ts

# Executar em modo debug
npx playwright test --debug
```

## Estrutura dos Testes

- `checkout.spec.ts` - Testes do fluxo de checkout completo
- `product.spec.ts` - Testes da página de produto
- `cart.spec.ts` - Testes do carrinho de compras

## Adicionar Test IDs

Para facilitar os testes, adicione `data-testid` nos componentes:

```tsx
<button data-testid="add-to-cart">Adicionar ao Carrinho</button>
<div data-testid="cart-total">{total}</div>
```

## CI/CD

Os testes podem ser executados no GitHub Actions:

```yaml
- name: Run E2E tests
  run: npx playwright test
```

