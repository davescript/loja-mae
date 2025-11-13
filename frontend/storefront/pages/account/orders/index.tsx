import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../../utils/api';
import { formatPrice } from '../../../../utils/format';
import { Order, PaginatedResponse } from '../../../../../shared/types';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent } from '../../../../admin/components/ui/card';
import { Badge } from '../../../../admin/components/ui/badge';
import { Button } from '../../../../admin/components/ui/button';
import { Input } from '../../../../admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../admin/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pagamento Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'processing', label: 'Em Preparação' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
];

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['customer-orders', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiRequest<PaginatedResponse<Order>>(
        `/api/customers/orders?${params.toString()}`
      );
      return response.data || { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    },
    staleTime: 30000,
  });

  const orders = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

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
      <div>
        <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe todos os seus pedidos e seu histórico de compras.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número do pedido..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: string) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Você ainda não fez nenhum pedido.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => navigate('/products')}>
                Começar a Comprar
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/account/orders/${order.order_number}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-muted-foreground" />
                          <span className="font-semibold text-lg">Pedido {order.order_number}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Data:</span>{' '}
                            {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          <div>
                            <span className="font-medium">Itens:</span> {order.items?.length || 0}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span>{' '}
                            <span className="font-semibold text-foreground">{formatPrice(order.total_cents)}</span>
                          </div>
                        </div>
                        {order.payment_status && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Pagamento: {order.payment_status === 'paid' ? 'Confirmado' : 'Pendente'}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    const url = `${import.meta.env.VITE_API_BASE_URL || 'https://api.leiasabores.pt'}/api/orders/${order.id}/invoice`;
                    const printWindow = window.open(url, '_blank');
                    if (printWindow) {
                      printWindow.onload = () => {
                        setTimeout(() => printWindow.print(), 500);
                      };
                    }
                  }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Fatura
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    navigate(`/account/orders/${order.order_number}`);
                  }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} pedidos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

