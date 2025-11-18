# 🔍 Verificar Imagem do Produto "Topo Minie"

## ✅ Status Atual

**Produto encontrado:**
- **ID**: 1
- **Título**: "Topo Minie"
- **Descrição**: "Topo para decorar bolo com o tema da Minie."
- **Preço**: R$ 2.999,00 (antes: R$ 3.499,00)
- **Status**: Ativo ✅
- **Imagens**: ❌ Nenhuma imagem associada no banco

## ⚠️ Problema Identificado

O produto **não tem imagens associadas** na tabela `product_images`. Mesmo que você tenha feito upload da imagem para o R2, ela precisa estar registrada no banco de dados.

## 🔧 Como Associar a Imagem ao Produto

### Opção 1: Via SQL (Recomendado)

```sql
-- 1. Primeiro, verifique se a imagem existe no R2 e anote a chave (key)
-- Exemplo: "produtos/topo-minie.jpg"

-- 2. Insira a imagem na tabela product_images
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
VALUES (
  1, -- ID do produto "Topo Minie"
  'produtos/topo-minie.jpg', -- Chave da imagem no R2 (ajuste conforme necessário)
  'Topo Minie para decorar bolo',
  1
);
```

### Opção 2: Via API (Upload + Associação)

```bash
# 1. Fazer upload da imagem via API
curl -X POST "https://loja-mae-api.davecdl.workers.dev/api/products/1/images" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -F "image=@/caminho/para/imagem.jpg" \
  -F "alt_text=Topo Minie para decorar bolo"

# 2. Verificar se a imagem foi associada
curl "https://loja-mae-api.davecdl.workers.dev/api/products/1?include=all"
```

### Opção 3: Via Admin Panel

1. Acesse `/admin/products`
2. Edite o produto "Topo Minie"
3. Vá para a aba "Imagens"
4. Faça upload da imagem
5. Salve

## 📋 Checklist

- [ ] Imagem existe no R2 (bucket `loja-mae-images`)
- [ ] Imagem está associada ao produto na tabela `product_images`
- [ ] URL da imagem está correta (formato: `produtos/nome-arquivo.jpg`)
- [ ] Produto retorna imagens na API (`/api/products/1?include=all`)

## 🧪 Testar

```bash
# Verificar produto com imagens
curl "https://loja-mae-api.davecdl.workers.dev/api/products/1?include=all" | python3 -m json.tool

# Deve retornar algo como:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "title": "Topo Minie",
#     "images": [
#       {
#         "id": 1,
#         "image_url": "https://loja-mae-api.davecdl.workers.dev/api/images/produtos/topo-minie.jpg",
#         "alt_text": "Topo Minie para decorar bolo",
#         "sort_order": 1
#       }
#     ]
#   }
# }
```

## 🎯 Próximos Passos

1. **Associar a imagem ao produto** (escolha uma das opções acima)
2. **Verificar se a API retorna a imagem**
3. **Limpar cache do navegador** (Ctrl+Shift+R)
4. **Verificar no site** se a imagem aparece

---

**Nota:** O React Query foi configurado para sempre buscar dados atualizados (`staleTime: 0`), então as mudanças devem aparecer imediatamente após associar a imagem.

