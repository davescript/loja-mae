import { useEffect } from 'react';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  price?: {
    amount: number;
    currency: string;
  };
  availability?: 'in stock' | 'out of stock' | 'preorder';
  structuredData?: object;
}

const DEFAULT_SITE_NAME = 'Leiasabores';
const DEFAULT_SITE_URL = 'https://www.leiasabores.pt';
const DEFAULT_DESCRIPTION = 'Loja online de produtos premium. Elegância moderna para o seu dia a dia.';
const DEFAULT_IMAGE = `${DEFAULT_SITE_URL}/og-image.jpg`;

/**
 * Hook para gerenciar SEO, Open Graph e meta tags dinamicamente
 */
export function useSEO(data: SEOData) {
  useEffect(() => {
    const {
      title,
      description = DEFAULT_DESCRIPTION,
      keywords,
      image = DEFAULT_IMAGE,
      url,
      type = 'website',
      siteName = DEFAULT_SITE_NAME,
      author,
      publishedTime,
      modifiedTime,
      price,
      availability,
      structuredData,
    } = data;

    // Title
    const fullTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : `${DEFAULT_SITE_NAME} — Elegância Moderna`;
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Helper function to update or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      
      element.setAttribute('href', href);
    };

    // Basic SEO Meta Tags
    setMetaTag('description', description);
    if (keywords) {
      setMetaTag('keywords', keywords);
    }
    setMetaTag('author', author || DEFAULT_SITE_NAME);
    setMetaTag('robots', 'index, follow');

    // Open Graph Tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', siteName, true);
    setMetaTag('og:locale', 'pt_PT', true);
    
    if (url) {
      setMetaTag('og:url', url, true);
    } else if (typeof window !== 'undefined') {
      setMetaTag('og:url', window.location.href, true);
    }

    // Article specific (for blog posts)
    if (type === 'article') {
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true);
      }
      if (author) {
        setMetaTag('article:author', author, true);
      }
    }

    // Product specific
    if (type === 'product') {
      if (price) {
        setMetaTag('product:price:amount', price.amount.toString(), true);
        setMetaTag('product:price:currency', price.currency, true);
      }
      if (availability) {
        setMetaTag('product:availability', availability, true);
      }
    }

    // Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Canonical URL
    if (url) {
      setLinkTag('canonical', url);
    } else if (typeof window !== 'undefined') {
      setLinkTag('canonical', window.location.href);
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Não limpar tudo, apenas resetar para valores padrão se necessário
      // O próximo useSEO vai sobrescrever
    };
  }, [data]);
}

