import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import StoreHeader from '../components/store/StoreHeader';
import StoreFooter from '../components/store/StoreFooter';
import WhatsAppButton from '../components/store/WhatsAppButton';

export default function StorefrontLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    </div>
  );
}
