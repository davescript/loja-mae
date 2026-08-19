import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import StoreHeader from '../components/store/StoreHeader';
import StoreFooter from '../components/store/StoreFooter';
import WhatsAppButton from '../components/store/WhatsAppButton';
import AIChat from '../components/store/AIChat';
import { useCartStore } from '../../store/cartStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { Toaster } from '../../admin/components/common/Toaster';
import ScrollToTop from '../../components/ScrollToTop';

// Rotas onde os botões flutuantes de suporte (WhatsApp/Chat) tapam elementos
// críticos — formulários curtos com CTA no rodapé (login/registo/checkout) e
// o portal do cliente, que já tem os próprios canais de contacto na sidebar.
const FLOATING_BUTTONS_HIDDEN_ON = ['/login', '/register', '/checkout'];

function shouldHideFloatingButtons(pathname: string): boolean {
  if (pathname.startsWith('/account')) return true;
  return FLOATING_BUTTONS_HIDDEN_ON.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function StorefrontLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const hideFloatingButtons = shouldHideFloatingButtons(location.pathname);
  const { loadFromServer: loadCartFromServer } = useCartStore();
  const { loadFromServer: loadFavoritesFromServer, syncWithServer: syncFavoritesWithServer } = useFavoritesStore();

  // Load cart and favorites from server when user logs in
  // IMPORTANTE: Não carregar automaticamente ao recarregar página para não sobrescrever localStorage
  // O Zustand persist já carrega do localStorage automaticamente
  useEffect(() => {
    // Só carregar do servidor quando usuário faz login (mudança de isAuthenticated)
    // Não carregar em recarregamentos normais para preservar localStorage
    if (isAuthenticated) {
      console.log('🛒 Usuário autenticado detectado, verificando carrinho e favoritos do servidor...');
      // Delay para garantir que localStorage já foi carregado pelo persist
      const timer = setTimeout(() => {
        loadCartFromServer();
        // Sincronizar favoritos locais com servidor ANTES de carregar do servidor
        // Isso garante que favoritos locais não sejam perdidos
        syncFavoritesWithServer().then(() => {
          // Depois de sincronizar, carregar do servidor
          loadFavoritesFromServer();
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log('🛒 Usuário não autenticado, carrinho e favoritos serão mantidos do localStorage');
    }
  }, [isAuthenticated, loadCartFromServer, loadFavoritesFromServer, syncFavoritesWithServer]);

  // Removido AppShell (Sidebar/Topbar) em favor de layout estilo loja

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <StoreHeader />
      <main className="pt-4 sm:pt-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <Outlet />
        </div>
      </main>
      <StoreFooter />
      {!hideFloatingButtons && (
        <>
          <WhatsAppButton />
          <AIChat />
        </>
      )}
      <Toaster />
    </div>
  );
}
