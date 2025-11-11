# 📦 Estrutura de Produtos no Banco de Dados

## ✅ Estrutura Atual (Normalizada - RECOMENDADA)

A estrutura atual usa **tabelas relacionadas** (normalizada), que é a melhor prática:

### 1. Tabela `products` (Informações Básicas)
```sql
- id (PRIMARY KEY)
- title
- slug
- description (TEXT - pode ser longo)
- short_description
- price_cents
- compare_at_price_cents
- sku
- stock_quantity
- status
- featured
- category_id
- meta_title
- meta_description
- created_at
- updated_at
```

### 2. Tabela `product_images` (Imagens Separadas)
```sql
- id
- product_id (FOREIGN KEY → products.id)
- image_url
- image_key (R2 key)
- alt_text
- position (ordem das imagens)
- is_primary (imagem principal)
```

### 3. Tabela `product_variants` (Variantes Separadas)
```sql
- id
- product_id (FOREIGN KEY → products.id)
- title
- price_cents
- stock_quantity
- option1, option2, option3 (tamanho, cor, etc.)
```

## 🔄 Como Funciona na API

Quando você busca um produto com `?include=all`, a API retorna um JSON assim:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Smartphone Premium XYZ",
    "description": "Descrição completa...",
    "price_cents": 299900,
    "slug": "smartphone-premium-xyz",
    // ... outros campos da tabela products
    
    "images": [
      {
        "id": 1,
        "product_id": 1,
        "image_url": "https://...",
        "alt_text": "Foto frontal",
        "position": 0,
        "is_primary": 1
      },
      {
        "id": 2,
        "product_id": 1,
        "image_url": "https://...",
        "alt_text": "Foto traseira",
        "position": 1,
        "is_primary": 0
      }
    ],
    
    "variants": [
      {
        "id": 1,
        "product_id": 1,
        "title": "128GB",
        "price_cents": 299900,
        "stock_quantity": 50
      }
    ],
    
    "category": {
      "id": 1,
      "name": "Eletrônicos",
      "slug": "eletronicos"
    }
  }
}
```

## ✅ Vantagens da Estrutura Atual

1. **Performance**: Queries SQL eficientes
2. **Flexibilidade**: Fácil adicionar/remover imagens
3. **Normalização**: Sem duplicação de dados
4. **Relacionamentos**: Foreign keys garantem integridade
5. **Busca**: Fácil buscar produtos por categoria, preço, etc.
6. **Escalabilidade**: Suporta muitos produtos e imagens

## ❌ Alternativa: Usar JSON (NÃO RECOMENDADO)

Se você quiser usar JSON, seria assim:

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  title TEXT,
  price_cents INTEGER,
  data JSON  -- Tudo em JSON: { description, images: [...], variants: [...] }
);
```

### Problemas com JSON:
- ❌ Difícil fazer queries SQL (buscar por preço, categoria, etc.)
- ❌ Difícil fazer JOINs
- ❌ Performance pior
- ❌ Difícil atualizar campos específicos
- ❌ Não aproveita índices do banco

## 🎯 Recomendação

**MANTENHA a estrutura atual!** Ela já está perfeita e segue as melhores práticas de banco de dados.

A API já retorna tudo em um único JSON quando você usa `?include=all`, então você tem o melhor dos dois mundos:
- ✅ Dados normalizados no banco (performance)
- ✅ JSON completo na API (facilidade de uso)

## 📝 Exemplo de Uso

### Buscar produto simples (sem imagens/variantes):
```bash
GET /api/products/1
```

### Buscar produto completo (com tudo):
```bash
GET /api/products/1?include=all
# ou
GET /api/products/smartphone-premium-xyz?include=all
```

### Listar produtos:
```bash
GET /api/products?status=active&pageSize=20
```

## 🔧 Se Quiser Mudar para JSON

Se você realmente quiser usar JSON (não recomendado), posso ajudar a criar uma migration, mas você perderá:
- Performance de queries
- Facilidade de busca
- Integridade referencial

**Prefere manter a estrutura atual ou mudar para JSON?**

