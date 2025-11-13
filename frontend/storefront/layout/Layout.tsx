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

  // Load cart from server when user logs in or when page loads
  useEffect(() => {
    // Carregar carrinho sempre que a página carregar (mesmo se não autenticado, para manter localStorage)
    // Se autenticado, carregar do servidor; se não, manter do localStorage
    if (isAuthenticated) {
      console.log('🛒 Usuário autenticado, carregando carrinho do servidor...');
      loadFromServer();
    } else {
      // Mesmo não autenticado, garantir que o carrinho do localStorage está carregado
      console.log('🛒 Usuário não autenticado, carrinho será mantido do localStorage');
    }
  }, [isAuthenticated, loadFromServer]);

  // Também carregar quando a página é montada (primeira vez)
  useEffect(() => {
    const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
    if (token) {
      // Pequeno delay para garantir que tudo está inicializado
      const timer = setTimeout(() => {
        loadFromServer();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loadFromServer]);

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
