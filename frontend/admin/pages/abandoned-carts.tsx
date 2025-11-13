import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { formatPrice } from '../../utils/format';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Mail,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  Euro,
  Package,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { DataTable, type Column } from '../components/common/DataTable';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface AbandonedCart {
  id: string;
  customer_id?: number | null;
  session_id?: string | null;
  email?: string | null;
  status: 'open' | 'abandoned' | 'recovered' | 'completed';
  total_cents: number;
  updated_at: string;
  created_at: string;
  items?: CartItem[];
}

interface CartItem {
  id: string;
  product_id: number;
  product_name: string;
  variant_id?: number | null;
  quantity: number;
  price_cents: number;
  image_url?: string | null;
  sku?: string | null;
}

export default function AdminAbandonedCartsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'abandoned-carts', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await apiRequest<{
        items: AbandonedCart[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(`/api/admin/carts/abandoned?${params.toString()}`);
      return response.data || { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (cartId: string) => {
      const response = await apiRequest<{ message: string }>(
        `/api/admin/carts/abandoned/${cartId}/send-email`,
        {
          method: 'POST',
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Email enviado',
        description: 'Email de recuperação enviado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'abandoned-carts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Não foi possível enviar o email',
        variant: 'destructive',
      });
    },
  });

  const filteredCarts = data?.items.filter((cart) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cart.email?.toLowerCase().includes(query) ||
        cart.id.toLowerCase().includes(query) ||
        cart.session_id?.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'abandoned':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'recovered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'abandoned':
        return 'Abandonado';
      case 'recovered':
        return 'Recuperado';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = async (cart: AbandonedCart) => {
    try {
      const response = await apiRequest<AbandonedCart>(
        `/api/admin/carts/abandoned/${cart.id}`
      );
      if (response.data) {
        setSelectedCart(response.data);
        setDetailsOpen(true);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do carrinho',
        variant: 'destructive',
      });
    }
  };

  const columns: Column<AbandonedCart>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (cart: AbandonedCart) => (
        <span className="font-mono text-xs">{cart.id.substring(0, 8)}...</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: (cart: AbandonedCart) => (
        <span className="text-sm">{cart.email || 'N/A'}</span>
      ),
    },
    {
      key: 'items',
      header: 'Itens',
      accessor: (cart: AbandonedCart) => (
        <span className="flex items-center gap-1">
          <Package className="w-4 h-4" />
          {cart.items?.length || 0}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      accessor: (cart: AbandonedCart) => (
        <span className="font-semibold">{formatPrice(cart.total_cents)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (cart: AbandonedCart) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cart.status)}`}
        >
          {getStatusLabel(cart.status)}
        </span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Última Atualização',
      accessor: (cart: AbandonedCart) => (
        <span className="text-sm text-muted-foreground">{formatDate(cart.updated_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      accessor: (cart: AbandonedCart) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(cart)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {cart.email && cart.status === 'abandoned' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendEmailMutation.mutate(cart.id)}
              disabled={sendEmailMutation.isPending}
            >
              <Mail className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Carrinhos Abandonados
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e recupere carrinhos de compra abandonados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, ID ou session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="abandoned">Abandonado</SelectItem>
              <SelectItem value="recovered">Recuperado</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Carrinhos</p>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Abandonados</p>
              <p className="text-2xl font-bold">
                {data?.items.filter((c) => c.status === 'abandoned').length || 0}
              </p>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recuperados</p>
              <p className="text-2xl font-bold">
                {data?.items.filter((c) => c.status === 'recovered').length || 0}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">
                {formatPrice(
                  data?.items.reduce((sum, cart) => sum + cart.total_cents, 0) || 0
                )}
              </p>
            </div>
            <Euro className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* Tabela */}
      <DataTable
        data={filteredCarts}
        columns={columns}
        loading={isLoading}
        searchable={false}
        pagination={{
          page,
          pageSize: 20,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />

      {/* Dialog de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carrinho #{selectedCart?.id.substring(0, 8)}</DialogTitle>
            <DialogDescription>Detalhes completos do carrinho</DialogDescription>
          </DialogHeader>

          {selectedCart && (
            <div className="space-y-6 mt-4">
              {/* Informações do Cliente */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCart.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCart.status)}`}
                    >
                      {getStatusLabel(selectedCart.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(selectedCart.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última atualização</p>
                    <p className="font-medium">{formatDate(selectedCart.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Itens do Carrinho */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Itens ({selectedCart.items?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedCart.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        {item.sku && (
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} x {formatPrice(item.price_cents)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price_cents * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(selectedCart.total_cents)}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedCart.email && selectedCart.status === 'abandoned' && (
                  <Button
                    onClick={() => {
                      sendEmailMutation.mutate(selectedCart.id);
                      setDetailsOpen(false);
                    }}
                    disabled={sendEmailMutation.isPending}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email de Recuperação
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/checkout?cart_id=${selectedCart.id}`, '_blank');
                  }}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Checkout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

