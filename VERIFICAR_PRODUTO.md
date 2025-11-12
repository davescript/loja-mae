# ✅ Verificar Produto Atualizado

## 📋 O que fazer após atualizar produto no banco

Após atualizar descrição, preço ou outros dados de um produto no banco de dados D1, siga estes passos:

### 1. ✅ Verificar se o produto está ativo

```sql
SELECT id, title, slug, price_cents, status, stock_quantity 
FROM products 
WHERE title LIKE '%minie%' OR slug LIKE '%minie%';
```

Execute via:
```bash
npx wrangler d1 execute loja-mae-db --remote --command="SELECT id, title, slug, price_cents, status, stock_quantity FROM products WHERE title LIKE '%minie%' OR slug LIKE '%minie%';"
```

### 2. ✅ Verificar se tem imagens associadas

```sql
SELECT pi.*, p.title 
FROM product_images pi
JOIN products p ON pi.product_id = p.id
WHERE p.title LIKE '%minie%' OR p.slug LIKE '%minie%';
```

Execute via:
```bash
npx wrangler d1 execute loja-mae-db --remote --command="SELECT pi.*, p.title FROM product_images pi JOIN products p ON pi.product_id = p.id WHERE p.title LIKE '%minie%' OR p.slug LIKE '%minie%';"
```

### 3. ✅ Verificar via API

```bash
# Listar todos os produtos ativos
curl "https://loja-mae-api.davecdl.workers.dev/api/products?status=active"

# Buscar produto específico por slug
curl "https://loja-mae-api.davecdl.workers.dev/api/products/topo-minie?include=all"
```

### 4. ✅ Limpar cache do frontend

O React Query tem cache. Para forçar atualização:

1. **Hard refresh no navegador:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)

2. **Limpar cache do navegador:**
   - Abra DevTools (F12)
   - Vá em Application > Storage > Clear site data

3. **Verificar no modo anônimo:**
   - Abra uma janela anônima/privada
   - Acesse o site

### 5. ✅ Verificar no site

1. Acesse: https://www.leiasabores.pt/products
2. Busque por "minie" ou "topo"
3. Verifique se o produto aparece com:
   - ✅ Descrição atualizada
   - ✅ Preço atualizado
   - ✅ Imagem do R2 carregando

### 6. ✅ Verificar imagem no R2

Se a imagem não estiver carregando:

1. **Verificar se a imagem existe no R2:**
   ```bash
   # Listar objetos no R2 (via wrangler)
   npx wrangler r2 object list loja-mae-images --prefix="products/"
   ```

2. **Verificar URL da imagem:**
   - A URL deve ser: `https://loja-mae-api.davecdl.workers.dev/api/images/{key}`
   - Ou: `https://api.leiasabores.pt/api/images/{key}`

3. **Testar URL da imagem:**
   ```bash
   curl -I "https://loja-mae-api.davecdl.workers.dev/api/images/{key-do-produto}"
   ```

## 🔧 Troubleshooting

### Produto não aparece na lista

**Causas possíveis:**
- Status não está como `'active'`
- `stock_quantity` está em 0 (verificar se isso afeta a listagem)
- Produto não tem categoria associada (se houver filtro)

**Solução:**
```sql
UPDATE products 
SET status = 'active', stock_quantity = 10 
WHERE slug = 'topo-minie';
```

### Imagem não carrega

**Causas possíveis:**
- Chave da imagem no banco não corresponde ao R2
- Imagem não foi uploadada para o R2
- URL da imagem está incorreta

**Solução:**
1. Verificar `image_key` na tabela `product_images`
2. Verificar se o arquivo existe no R2 com essa chave
3. Re-uploadar a imagem se necessário via API

### Preço não atualizado

**Causas possíveis:**
- Cache do navegador
- `price_cents` não foi atualizado corretamente (lembre-se: preço em centavos!)

**Solução:**
```sql
-- Exemplo: R$ 9,90 = 990 centavos
UPDATE products 
SET price_cents = 990 
WHERE slug = 'topo-minie';
```

## 📝 Checklist

- [ ] Produto está com `status = 'active'`
- [ ] `price_cents` está correto (em centavos)
- [ ] Descrição foi atualizada
- [ ] Imagem existe no R2
- [ ] `product_images` tem registro com `image_key` correto
- [ ] Cache do navegador foi limpo
- [ ] Produto aparece na API
- [ ] Produto aparece no site

## 🚀 Próximos Passos

1. Verifique o produto via API
2. Limpe o cache do navegador
3. Acesse o site e confirme as mudanças
4. Se necessário, re-upload a imagem via API

---

**Status:** ✅ Pronto para verificar

