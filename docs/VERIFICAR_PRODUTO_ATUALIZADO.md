# ✅ Verificar Produto Atualizado

## 📋 O que fazer após atualizar produto no banco

Após atualizar descrição, preço ou outros dados de um produto no banco de dados:

### 1. **Verificar se a API está retornando dados atualizados**

```bash
# Buscar produto específico
curl "https://loja-mae-api.davecdl.workers.dev/api/products?search=minie"

# Ou buscar por ID/slug
curl "https://loja-mae-api.davecdl.workers.dev/api/products/[slug-do-produto]"
```

### 2. **Limpar cache do navegador**

O React Query pode estar usando dados em cache. Para ver as mudanças:

**Opção A: Hard Refresh no navegador**
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

**Opção B: Limpar cache do navegador**
- Abra DevTools (F12)
- Clique com botão direito no botão de refresh
- Selecione "Empty Cache and Hard Reload"

**Opção C: Modo anônimo**
- Abra uma janela anônima/privada
- Acesse o site
- As mudanças devem aparecer imediatamente

### 3. **Verificar se as imagens estão carregando do R2**

As imagens devem estar sendo servidas via:
- URL: `https://loja-mae-api.davecdl.workers.dev/api/images/{key}`
- Ou: `https://api.leiasabores.pt/api/images/{key}` (se configurado)

**Testar imagem:**
```bash
# Substitua {key} pela chave da imagem no R2
curl -I "https://loja-mae-api.davecdl.workers.dev/api/images/{key}"
```

### 4. **Invalidar cache do React Query (se necessário)**

Se as mudanças não aparecerem, o cache do React Query pode estar ativo. O cache atual:
- `staleTime`: 5 minutos (algumas queries)
- `refetchOnWindowFocus`: false

**Solução temporária:**
- Feche e reabra a aba do navegador
- Ou aguarde alguns minutos para o cache expirar

### 5. **Verificar no Admin Panel**

Acesse `/admin/products` e verifique se:
- O produto aparece com os dados atualizados
- As imagens estão sendo exibidas corretamente

### 6. **Verificar logs do Worker (se houver problemas)**

```bash
# Ver logs em tempo real
npx wrangler tail --name loja-mae-api
```

## 🔍 Checklist de Verificação

- [ ] Dados atualizados no banco de dados D1
- [ ] API retorna dados atualizados (teste com curl)
- [ ] Imagens existem no R2 e são acessíveis
- [ ] Cache do navegador limpo
- [ ] Produto aparece atualizado no site
- [ ] Imagens carregam corretamente

## 🆘 Se ainda não aparecer

1. **Verifique se o produto está ativo:**
   ```sql
   SELECT status FROM products WHERE slug = 'topo-da-minie';
   -- Deve retornar 'active'
   ```

2. **Verifique se há imagens associadas:**
   ```sql
   SELECT * FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'topo-da-minie');
   ```

3. **Verifique a URL da imagem no R2:**
   - A imagem deve existir no bucket R2
   - A chave (key) deve estar correta na tabela `product_images`

4. **Teste a API diretamente:**
   ```bash
   curl "https://loja-mae-api.davecdl.workers.dev/api/products?search=minie&include=all"
   ```

---

**Status:** ✅ Pronto para verificar

