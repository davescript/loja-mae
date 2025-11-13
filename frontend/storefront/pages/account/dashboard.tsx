import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { Order } from '../../../../shared/types';
import { motion } from 'framer-motion';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  DollarSign,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../admin/components/ui/card';
import { Badge } from '../../../admin/components/ui/badge';
import { Button } from '../../../admin/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch customer orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', 'dashboard'],
    queryFn: async () => {
      const response = await apiRequest<{ items: Order[]; total: number }>('/api/customers/orders?limit=5');
      return response.data || { items: [], total: 0 };
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Fetch customer stats
  const { data: statsData } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const response = await apiRequest<{
        total_orders: number;
        total_spent: number;
        pending_orders: number;
        recent_order: Order | null;
      }>('/api/customers/stats');
      return response.data || {
        total_orders: 0,
        total_spent: 0,
        pending_orders: 0,
        recent_order: null,
      };
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const orders = ordersData?.items || [];
  const stats = statsData || {
    total_orders: 0,
    total_spent: 0,
    pending_orders: 0,
    recent_order: null,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pendente' },
      paid: { variant: 'default', label: 'Pago' },
      processing: { variant: 'secondary', label: 'Em Preparação' },
      shipped: { variant: 'secondary', label: 'Enviado' },
      delivered: { variant: 'default', label: 'Entregue' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
      refunded: { variant: 'destructive', label: 'Reembolsado' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Olá, {user?.name || (user?.email ? user.email.split('@')[0] : 'Cliente')}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu portal. Acompanhe seus pedidos e gerencie sua conta.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders}</div>
            <p className="text-xs text-muted-foreground">Todos os tempos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.total_spent)}</div>
            <p className="text-xs text-muted-foreground">Valor total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_orders}</div>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Pedido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recent_order ? formatPrice(stats.recent_order.total_cents) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.recent_order 
                ? format(new Date(stats.recent_order.created_at), "dd/MM/yyyy", { locale: ptBR })
                : 'Nenhum pedido'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimos Pedidos</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/account/orders')}>
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
              <Button className="mt-4" onClick={() => navigate('/products')}>
                Começar a Comprar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/account/orders/${order.order_number}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Pedido {order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      <span>•</span>
                      <span>{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">{formatPrice(order.total_cents)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver Detalhes
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

