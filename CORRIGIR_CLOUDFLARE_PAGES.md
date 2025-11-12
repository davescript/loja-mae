# 🔧 Como Corrigir o Problema de MIME Type no Cloudflare Pages

## Problema
O Cloudflare Pages está servindo o `index.html` do repositório (com `/frontend/main.tsx`) em vez do build compilado (com `/assets/index-*.js`).

## Solução

### Opção 1: Configurar Cloudflare Pages para usar GitHub Actions (Recomendado)

1. Acesse: https://dash.cloudflare.com
2. Vá em **Workers & Pages** > **loja-mae**
3. Clique em **Settings** > **Builds & deployments**
4. Verifique:
   - **Source**: Deve estar conectado ao GitHub
   - **Build command**: Deve estar **VAZIO** (GitHub Actions faz o build)
   - **Build output directory**: Deve estar como `dist`
   - **Root directory**: Deve estar vazio ou como `/`

5. Se houver um build command configurado, **REMOVA-O**
6. Salve as alterações

### Opção 2: Usar Deploy Direto (Alternativa)

Se o GitHub Actions não estiver funcionando, você pode fazer deploy direto:

```bash
# 1. Fazer build local
npm run build:frontend

# 2. Fazer deploy direto
npx wrangler pages deploy dist --project-name=loja-mae
```

### Opção 3: Configurar Build no Cloudflare Pages

Se preferir que o Cloudflare Pages faça o build:

1. Acesse: https://dash.cloudflare.com
2. Vá em **Workers & Pages** > **loja-mae** > **Settings** > **Builds & deployments**
3. Configure:
   - **Build command**: `npm run build:frontend`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Node version**: `20`

## Verificação

Após configurar, aguarde 2-3 minutos e verifique:

```bash
curl https://www.leiasabores.pt | grep -E "script|main"
```

Deve mostrar:
```html
<script type="module" crossorigin src="/assets/index-*.js"></script>
```

**NÃO** deve mostrar:
```html
<script type="module" src="/frontend/main.tsx"></script>
```

## Status Atual

- ✅ GitHub Actions configurado para fazer build
- ✅ Arquivo `_headers` criado com MIME types corretos
- ✅ Build local está correto
- ⚠️ Cloudflare Pages precisa ser configurado corretamente

