import type { Product } from '@shared/types';
import type { BlogPost } from '@shared/types';

const SITE_URL = 'https://www.leiasabores.pt';
const SITE_NAME = 'Leiasabores';

/**
 * Gera dados de SEO para um produto
 */
export function generateProductSEO(product: Product) {
  const imageUrl = product.images?.[0]?.image_url
    ? (product.images[0].image_url.startsWith('http')
        ? product.images[0].image_url
        : `${SITE_URL}${product.images[0].image_url}`)
    : `${SITE_URL}/og-image.jpg`;

  const price = product.variants && product.variants.length > 0
    ? product.variants[0].price_cents
    : product.price_cents || 0;

  const availability: 'in stock' | 'out of stock' = product.status === 'active' ? 'in stock' : 'out of stock';

  // Structured Data para Product
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || product.short_description || '',
    image: product.images?.map(img =>
      img.image_url.startsWith('http') ? img.image_url : `${SITE_URL}${img.image_url}`
    ) || [imageUrl],
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'EUR',
      price: (price / 100).toFixed(2),
      availability: `https://schema.org/${availability === 'in stock' ? 'InStock' : 'OutOfStock'}`,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    ...(product.sku && { sku: product.sku }),
    ...(product.category && {
      category: {
        '@type': 'Thing',
        name: product.category.name,
      },
    }),
  };

  return {
    title: product.title,
    description: product.description || product.short_description || `Compre ${product.title} na ${SITE_NAME}`,
    keywords: `${product.title}, ${product.category?.name || ''}`,
    image: imageUrl,
    url: `${SITE_URL}/product/${product.slug}`,
    type: 'product' as const,
    price: {
      amount: price / 100,
      currency: 'EUR',
    },
    availability,
    structuredData,
  };
}

/**
 * Gera dados de SEO para um post de blog
 */
export function generateBlogPostSEO(post: BlogPost) {
  const imageUrl = post.cover_image_url
    ? (post.cover_image_url.startsWith('http')
        ? post.cover_image_url
        : `${SITE_URL}${post.cover_image_url}`)
    : `${SITE_URL}/og-image.jpg`;

  // Structured Data para Article
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    image: imageUrl,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  return {
    title: post.title,
    description: post.excerpt || '',
    keywords: '',
    image: imageUrl,
    url: `${SITE_URL}/blog/${post.slug}`,
    type: 'article' as const,
    author: SITE_NAME,
    publishedTime: post.published_at || post.created_at,
    modifiedTime: post.updated_at || post.published_at || post.created_at,
    structuredData,
  };
}

/**
 * Gera dados de SEO para a página inicial
 */
export function generateHomeSEO() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return {
    title: 'Início',
    description: 'Loja online de produtos premium. Elegância moderna para o seu dia a dia. Descubra nossa coleção exclusiva.',
    keywords: 'loja online, produtos premium, elegância, moda, acessórios',
    image: `${SITE_URL}/og-image.jpg`,
    url: SITE_URL,
    type: 'website' as const,
    structuredData,
  };
}

/**
 * Gera dados de SEO para página de categorias
 */
export function generateCategorySEO(categoryName: string, description?: string) {
  return {
    title: categoryName,
    description: description || `Explore nossa coleção de ${categoryName}`,
    keywords: `${categoryName}, produtos, loja online`,
    image: `${SITE_URL}/og-image.jpg`,
    url: `${SITE_URL}/categories`,
    type: 'website' as const,
  };
}

