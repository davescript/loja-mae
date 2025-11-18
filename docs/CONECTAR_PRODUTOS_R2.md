# 📦 Conectar Produtos com R2 - Guia Completo

## ✅ O que foi implementado:

### 1. Rota de Imagens (`/api/images/{key}`)
- ✅ Rota criada para servir imagens do R2 via Worker
- ✅ Headers de cache configurados
- ✅ CORS habilitado para imagens
- ✅ Suporte a diferentes tipos de imagem (JPEG, PNG, WebP, GIF)

### 2. URLs Públicas do R2
- ✅ URLs geradas automaticamente ao fazer upload
- ✅ Formato: `https://loja-mae-api.davecdl.workers.dev/api/images/{key}`
- ✅ Suporte para domínio customizado (futuro)

### 3. Produtos no Banco
- ✅ 7 produtos de exemplo criados
- ✅ 6 categorias criadas
- ✅ Todos os produtos estão ativos e prontos para uso

## 📋 Produtos Criados:

1. **Smartphone Premium XYZ** - R$ 2.999,00
2. **Notebook Gamer Pro** - R$ 5.999,00
3. **Camiseta Básica Algodão** - R$ 49,90
4. **Guia Completo de TypeScript** - R$ 79,90
5. **Sofá Retrátil Conforto** - R$ 1.299,00
6. **Tênis Esportivo Pro** - R$ 299,90
7. **Perfume Elegance 100ml** - R$ 199,90

## 🚀 Como fazer upload de imagens:

### Via API (Admin):

```bash
# 1. Fazer login como admin
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@loja-mae.com", "password": "admin123"}'

# 2. Criar produto com imagens
curl -X POST https://loja-mae-api.davecdl.workers.dev/api/products \
  -H "Authorization: Bearer {token}" \
  -F "title=Produto Teste" \
  -F "description=Descrição do produto" \
  -F "price_cents=9990" \
  -F "stock_quantity=10" \
  -F "status=active" \
  -F "category_id=1" \
  -F "images=@/caminho/para/imagem1.jpg" \
  -F "images=@/caminho/para/imagem2.jpg"
```

### Via Frontend Admin:
1. Acesse o painel admin
2. Vá em "Produtos" → "Criar Produto"
3. Preencha os dados do produto
4. Faça upload das imagens
5. Salve o produto

## 🧪 Testar:

### 1. Listar Produtos:
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/products
```

### 2. Buscar Produto por Slug:
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/products/smartphone-premium-xyz
```

### 3. Listar Categorias:
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/categories
```

### 4. Acessar Imagem (quando houver):
```bash
curl https://loja-mae-api.davecdl.workers.dev/api/images/products/1234567890-abc.jpg
```

## 📝 Próximos Passos:

1. **Fazer upload de imagens reais** para os produtos existentes
2. **Configurar domínio customizado** para R2 (opcional)
3. **Testar no frontend** se os produtos aparecem corretamente
4. **Adicionar mais produtos** conforme necessário

## 🔧 Configuração do R2:

### Bucket Configurado:
- **Nome**: `loja-mae-images`
- **Localização**: WEUR (West Europe)
- **Status**: Ativo e funcionando

### Estrutura de Pastas:
```
loja-mae-images/
  ├── products/
  │   ├── {timestamp}-{random}.jpg
  │   ├── {timestamp}-{random}.png
  │   └── ...
  ├── categories/
  │   └── ...
  └── ...
```

## 🎯 URLs das Imagens:

Quando uma imagem é uploadada, ela recebe:
- **Key**: `products/1731234567890-abc123.jpg`
- **URL**: `https://loja-mae-api.davecdl.workers.dev/api/images/products/1731234567890-abc123.jpg`

A URL é salva no banco de dados na tabela `product_images`.

## ⚠️ Notas Importantes:

1. **Limite de tamanho**: 5MB por imagem
2. **Tipos permitidos**: JPEG, PNG, WebP, GIF
3. **Cache**: Imagens são cacheadas por 1 ano
4. **CORS**: Habilitado para todos os domínios (pode restringir depois)

## 🐛 Troubleshooting:

### Erro: "Image not found"
- Verifique se a key da imagem está correta
- Confirme se a imagem existe no R2
- Verifique se o Worker tem acesso ao R2

### Erro: "Invalid file type"
- Use apenas JPEG, PNG, WebP ou GIF
- Verifique o tipo MIME do arquivo

### Erro: "File size exceeds limit"
- Reduza o tamanho da imagem para menos de 5MB
- Use compressão de imagem se necessário

## 📚 Documentação Adicional:

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)

