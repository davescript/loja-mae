import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

/**
 * Componente para carregar Google Analytics
 * Adiciona o script do GA4 e inicializa o tracking
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Só carregar se tiver measurement ID e estiver em produção
    if (!measurementId || typeof window === 'undefined') {
      return;
    }

    // Verificar se já foi carregado
    if (window.gtag) {
      return;
    }

    // Carregar script do Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Inicializar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      page_path: window.location.pathname,
    });

    // Track page views em mudanças de rota
    const handleRouteChange = () => {
      if (window.gtag) {
        window.gtag('config', measurementId, {
          page_path: window.location.pathname,
        });
      }
    };

    // Usar MutationObserver para detectar mudanças de rota (React Router)
    const observer = new MutationObserver(() => {
      handleRouteChange();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [measurementId]);

  return null;
}

// Declaração de tipos globais para TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

