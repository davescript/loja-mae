import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  HeadphonesIcon,
  Bell,
  LogOut,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../admin/components/ui/button';
import { Badge } from '../../admin/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { useState } from 'react';

export default function CustomerPortalLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['customer-notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiRequest<{ count: number }>('/api/customers/notifications/unread-count');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
  });

  const unreadCount = notificationsData?.count || 0;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Portal do Cliente</h1>
        <p className="text-muted-foreground mb-6">Você precisa fazer login para acessar seu portal.</p>
        <Button onClick={() => navigate('/login')}>Fazer Login</Button>
      </div>
    );
  }

  const menuItems = [
    { to: '/account', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/account/orders', label: 'Meus Pedidos', icon: Package },
    { to: '/account/profile', label: 'Meu Perfil', icon: User },
    { to: '/account/addresses', label: 'Endereços', icon: MapPin },
    { to: '/account/payments', label: 'Pagamentos', icon: CreditCard },
    { to: '/account/support', label: 'Suporte', icon: HeadphonesIcon },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')} className="text-lg font-bold">
                Loja Mãe
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Portal do Cliente</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg p-4 z-50">
                    <p className="text-sm font-medium mb-2">Notificações</p>
                    <p className="text-xs text-muted-foreground">
                      {unreadCount > 0 
                        ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                        : 'Nenhuma notificação nova'}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        navigate('/account/notifications');
                        setNotificationsOpen(false);
                      }}
                    >
                      Ver todas
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Loja
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

