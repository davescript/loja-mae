# 🧹 Limpar Produtos de Exemplo

## 📋 Objetivo

Remover todos os produtos simulados/exemplo do banco de dados e garantir que o site funcione apenas com dados reais.

## 🗑️ Produtos que serão removidos

Os seguintes produtos de exemplo serão deletados:
- Smartphone Premium XYZ
- Notebook Gamer Pro
- Camiseta Básica Algodão
- Guia Completo de TypeScript
- Sofá Retrátil Conforto
- Tênis Esportivo Pro
- Perfume Elegance 100ml

## ⚙️ Como executar

### Opção 1: Script Automático (Recomendado)

```bash
# Para banco LOCAL (desenvolvimento)
chmod +x scripts/limpar-produtos-exemplo.sh
./scripts/limpar-produtos-exemplo.sh --local

# Para banco REMOTO (produção) - CUIDADO!
./scripts/limpar-produtos-exemplo.sh --remote
```

### Opção 2: Manual via Wrangler

```bash
# Local
npx wrangler d1 execute loja-mae-db --local --file=./scripts/limpar-produtos-exemplo.sql

# Remoto (produção)
npx wrangler d1 execute loja-mae-db --remote --file=./scripts/limpar-produtos-exemplo.sql
```

## ✅ Verificações

Após limpar, verifique:

1. **Produtos no banco:**
   ```bash
   npx wrangler d1 execute loja-mae-db --remote --command="SELECT COUNT(*) as total FROM products;"
   ```

2. **Categorias:**
   ```bash
   npx wrangler d1 execute loja-mae-db --remote --command="SELECT COUNT(*) as total FROM categories;"
   ```

3. **Imagens:**
   ```bash
   npx wrangler d1 execute loja-mae-db --remote --command="SELECT COUNT(*) as total FROM product_images;"
   ```

## 📝 Adicionar Produtos Reais

Após limpar, adicione produtos reais usando:

1. **Via API (Recomendado):**
   ```bash
   # Use o script de exemplo
   node scripts/adicionar-produto-exemplo.js
   ```

2. **Via Admin Panel:**
   - Acesse `/admin/products`
   - Clique em "Criar Produto"
   - Preencha os dados e faça upload das imagens

3. **Via API direta:**
   ```bash
   curl -X POST https://loja-mae-api.davecdl.workers.dev/api/products \
     -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
     -F "title=Produto Real" \
     -F "description=Descrição do produto" \
     -F "price_cents=1999" \
     -F "stock_quantity=10" \
     -F "status=active" \
     -F "category_id=1" \
     -F "images=@imagem.jpg"
   ```

## 🔍 Verificar se está funcionando

1. Acesse: https://www.leiasabores.pt/products
2. Verifique se não há produtos de exemplo
3. Adicione produtos reais via admin
4. Verifique se as imagens carregam do R2

## ⚠️ Importante

- **Backup:** Considere fazer backup antes de limpar produção
- **Imagens R2:** As imagens dos produtos deletados permanecerão no R2 (não são deletadas automaticamente)
- **Categorias:** Categorias vazias também serão removidas

---

**Status:** ✅ Pronto para executar

