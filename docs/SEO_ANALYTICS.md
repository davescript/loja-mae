# SEO e Analytics - Guia de Implementação

## ✅ Funcionalidades Implementadas

### 1. **Meta Tags de SEO**
- ✅ Meta tags básicas (description, keywords, author, robots)
- ✅ Meta tags dinâmicas por página
- ✅ Canonical URLs

### 2. **Open Graph Tags**
- ✅ Tags Open Graph para Facebook, LinkedIn, WhatsApp
- ✅ Suporte para produtos, artigos e páginas gerais
- ✅ Imagens dinâmicas por conteúdo

### 3. **Twitter Cards**
- ✅ Twitter Card tipo "summary_large_image"
- ✅ Título, descrição e imagem otimizados

### 4. **Structured Data (JSON-LD)**
- ✅ Schema.org para produtos (Product schema)
- ✅ Schema.org para artigos (Article schema)
- ✅ Schema.org para website (WebSite schema)
- ✅ Dados estruturados para melhor indexação no Google

### 5. **Google Analytics**
- ✅ Integração com Google Analytics 4 (GA4)
- ✅ Tracking automático de page views
- ✅ Configurável via variável de ambiente

## 📋 Como Usar

### Configurar Google Analytics

1. **Obter o Measurement ID:**
   - Acesse [Google Analytics](https://analytics.google.com/)
   - Crie uma propriedade ou use uma existente
   - Copie o Measurement ID (formato: `G-XXXXXXXXXX`)

2. **Configurar variável de ambiente:**
   ```bash
   # No arquivo .env ou nas variáveis de ambiente do Cloudflare Pages
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Deploy:**
   - O Google Analytics será carregado automaticamente se a variável estiver configurada

### Usar SEO em Páginas

#### Página de Produto
```typescript
import { useSEO } from '../../hooks/useSEO';
import { generateProductSEO } from '../../utils/seo';

export default function ProductPage() {
  const { data: product } = useQuery(...);
  
  useSEO(product ? generateProductSEO(product) : {
    title: 'Produto',
    description: 'Produto não encontrado',
  });
  
  // ... resto do componente
}
```

#### Página de Blog
```typescript
import { useSEO } from '../../hooks/useSEO';
import { generateBlogPostSEO } from '../../utils/seo';

export default function BlogPostPage() {
  const { data: post } = useQuery(...);
  
  useSEO(post ? generateBlogPostSEO(post) : {
    title: 'Post do Blog',
    description: 'Post não encontrado',
  });
  
  // ... resto do componente
}
```

#### Página Inicial
```typescript
import { useSEO } from '../../hooks/useSEO';
import { generateHomeSEO } from '../../utils/seo';

export default function HomePage() {
  useSEO(generateHomeSEO());
  
  // ... resto do componente
}
```

## 🎯 Páginas com SEO Implementado

- ✅ **Home** (`/`) - SEO básico + WebSite schema
- ✅ **Produtos** (`/product/:slug`) - Product schema + Open Graph
- ✅ **Blog** (`/blog/:slug`) - Article schema + Open Graph
- ✅ **Categorias** (`/categories`) - SEO básico

## 📊 Estrutura de Dados

### Product Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nome do Produto",
  "description": "Descrição",
  "image": ["url1", "url2"],
  "brand": { "@type": "Brand", "name": "Leiasabores" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "EUR",
    "price": "29.99",
    "availability": "https://schema.org/InStock"
  }
}
```

### Article Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Título",
  "description": "Descrição",
  "datePublished": "2025-01-01",
  "author": { "@type": "Organization", "name": "Leiasabores" }
}
```

## 🔍 Verificação

### Testar Open Graph
1. Use o [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Ou o [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Testar Structured Data
1. Use o [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Ou o [Schema.org Validator](https://validator.schema.org/)

### Verificar Google Analytics
1. Acesse o Google Analytics
2. Vá em "Tempo Real" para ver visitantes ativos
3. Verifique se os eventos estão sendo registrados

## 📝 Notas Importantes

- **Imagens Open Graph**: Certifique-se de ter uma imagem padrão em `/og-image.jpg`
- **URLs Canônicas**: São geradas automaticamente baseadas na URL atual
- **Performance**: O hook `useSEO` é otimizado e não causa re-renders desnecessários
- **Fallbacks**: Todas as páginas têm valores padrão caso os dados não estejam disponíveis

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar sitemap.xml dinâmico
- [ ] Adicionar robots.txt
- [ ] Implementar breadcrumbs schema
- [ ] Adicionar FAQ schema para páginas de suporte
- [ ] Implementar Review/Rating schema para produtos

