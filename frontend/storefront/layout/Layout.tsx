import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import StoreHeader from '../components/store/StoreHeader';
import StoreFooter from '../components/store/StoreFooter';
import WhatsAppButton from '../components/store/WhatsAppButton';
import AIChat from '../components/store/AIChat';
import { useCartStore } from '../../store/cartStore';
import { Toaster } from '../../admin/components/common/Toaster';

export default function StorefrontLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loadFromServer } = useCartStore();

  // Load cart from server when user logs in
  // IMPORTANTE: Não carregar automaticamente ao recarregar página para não sobrescrever localStorage
  // O Zustand persist já carrega do localStorage automaticamente
  useEffect(() => {
    // Só carregar do servidor quando usuário faz login (mudança de isAuthenticated)
    // Não carregar em recarregamentos normais para preservar localStorage
    if (isAuthenticated) {
      console.log('🛒 Usuário autenticado detectado, verificando carrinho do servidor...');
      // Delay para garantir que localStorage já foi carregado pelo persist
      const timer = setTimeout(() => {
        loadFromServer();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log('🛒 Usuário não autenticado, carrinho será mantido do localStorage');
    }
  }, [isAuthenticated]); // Remover loadFromServer da dependência para evitar loops

  // Removido AppShell (Sidebar/Topbar) em favor de layout estilo loja

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <Outlet />
        </div>
      </main>
      <StoreFooter />
      <WhatsAppButton />
      <AIChat />
      <Toaster />
    </div>
  );
}
