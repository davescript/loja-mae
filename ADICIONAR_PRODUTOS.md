# 🛍️ Como Adicionar Produtos com Imagens

## ✅ Estrutura Mantida (Normalizada)

A estrutura atual está perfeita! Vamos usar ela para adicionar produtos.

## 📝 Métodos para Adicionar Produtos

### 1. Via API (FormData - RECOMENDADO)

Use `FormData` para enviar dados do produto + imagens:

```bash
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/products \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -F "title=Produto Teste" \
  -F "description=Descrição completa do produto" \
  -F "short_description=Descrição curta" \
  -F "price_cents=29990" \
  -F "compare_at_price_cents=34990" \
  -F "sku=PROD-001" \
  -F "stock_quantity=50" \
  -F "status=active" \
  -F "featured=1" \
  -F "category_id=1" \
  -F "meta_title=Produto Teste - Loja Mãe" \
  -F "meta_description=Descrição para SEO" \
  -F "images=@/caminho/para/imagem1.jpg" \
  -F "images=@/caminho/para/imagem2.jpg" \
  -F "image_alt_0=Imagem principal" \
  -F "image_alt_1=Imagem secundária"
```

### 2. Via Admin Panel (Frontend)

O admin panel permite adicionar produtos com interface visual:
- Acesse: `/admin/products`
- Clique em "Novo Produto"
- Preencha os dados
- Faça upload das imagens
- Salve

### 3. Via SQL (Para dados iniciais)

Use o script de seed para adicionar produtos iniciais:

```bash
npx wrangler d1 execute loja-mae-db --remote --file=./scripts/seed-produtos.sql
```

## 🖼️ Adicionar Imagens a Produtos Existentes

### Via API (FormData)

```bash
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/products/1/images \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -F "images=@/caminho/para/imagem.jpg" \
  -F "alt_text=Descrição da imagem" \
  -F "position=0" \
  -F "is_primary=1"
```

### Via Endpoint de Update

```bash
curl -X PUT https://loja-mae-api.davecdl.workers.dev/api/products/1 \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -F "title=Produto Atualizado" \
  -F "images=@/caminho/para/nova-imagem.jpg"
```

## 📋 Estrutura Completa de um Produto

### Campos Obrigatórios:
- `title` (string): Nome do produto
- `price_cents` (number): Preço em centavos (ex: 29990 = R$ 299,90)

### Campos Opcionais:
- `description` (string): Descrição completa
- `short_description` (string): Descrição curta
- `compare_at_price_cents` (number): Preço comparativo
- `sku` (string): Código SKU único
- `barcode` (string): Código de barras
- `stock_quantity` (number): Quantidade em estoque
- `track_inventory` (number): 0 ou 1
- `weight_grams` (number): Peso em gramas
- `status` (string): 'draft', 'active', 'archived'
- `featured` (number): 0 ou 1
- `category_id` (number): ID da categoria
- `meta_title` (string): Título SEO
- `meta_description` (string): Descrição SEO

### Imagens:
- `images` (File[]): Array de arquivos de imagem
- `image_alt_0`, `image_alt_1`, etc.: Texto alternativo para cada imagem

## 🔐 Autenticação

Para criar/editar produtos, você precisa de autenticação admin:

```bash
# 1. Fazer login como admin
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@loja-mae.com",
    "password": "admin123"
  }'

# 2. Usar o token retornado
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/products \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "title=Produto Teste" \
  -F "price_cents=29990"
```

## 📦 Exemplo Completo (JavaScript/TypeScript)

```typescript
async function criarProdutoComImagens() {
  const formData = new FormData();
  
  // Dados básicos
  formData.append('title', 'Smartphone Premium');
  formData.append('description', 'Smartphone de última geração...');
  formData.append('short_description', 'Smartphone premium');
  formData.append('price_cents', '299900');
  formData.append('compare_at_price_cents', '349900');
  formData.append('sku', 'SM-001');
  formData.append('stock_quantity', '50');
  formData.append('status', 'active');
  formData.append('featured', '1');
  formData.append('category_id', '1');
  
  // Imagens
  const imagem1 = await fetch('/caminho/imagem1.jpg')
    .then(r => r.blob());
  const imagem2 = await fetch('/caminho/imagem2.jpg')
    .then(r => r.blob());
  
  formData.append('images', imagem1, 'imagem1.jpg');
  formData.append('images', imagem2, 'imagem2.jpg');
  formData.append('image_alt_0', 'Foto frontal do smartphone');
  formData.append('image_alt_1', 'Foto traseira do smartphone');
  
  const response = await fetch('https://loja-mae-api.davecdl.workers.dev/api/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  console.log('Produto criado:', result);
}
```

## 🧪 Testar Localmente

### 1. Iniciar servidor de desenvolvimento:

```bash
npm run dev:backend
```

### 2. Criar produto:

```bash
curl -X POST http://localhost:8787/api/products \
  -F "title=Produto Teste" \
  -F "price_cents=29990" \
  -F "status=active" \
  -F "images=@./test-image.jpg"
```

## 📊 Ver Produtos Criados

### Listar todos:
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/products
```

### Ver produto específico (com imagens):
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/products/1?include=all
```

### Ver por slug:
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/products/smartphone-premium-xyz?include=all
```

## 🎯 Próximos Passos

1. ✅ Estrutura do banco está pronta
2. ✅ API está funcionando
3. ✅ Endpoints de criação/edição disponíveis
4. 🔄 Adicionar produtos via Admin Panel
5. 🔄 Fazer upload de imagens para R2

## 📝 Notas Importantes

- **Imagens**: São armazenadas no R2 e referenciadas na tabela `product_images`
- **Slug**: É gerado automaticamente a partir do título
- **Preço**: Sempre em centavos (ex: 29990 = R$ 299,90)
- **Status**: 'draft' (rascunho), 'active' (ativo), 'archived' (arquivado)
- **Featured**: 1 = destaque, 0 = normal

## 🔗 Links Úteis

- API Base: `https://loja-mae-api.davecdl.workers.dev`
- Endpoint Produtos: `/api/products`
- Endpoint Imagens: `/api/products/{id}/images`
- Documentação: `ESTRUTURA_PRODUTOS.md`

