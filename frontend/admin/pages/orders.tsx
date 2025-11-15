import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Order, OrderItem, Customer, Address } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../../utils/format';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  FileText,
  RefreshCw,
  User, // Adicionado import do ícone User
} from 'lucide-react';
import {
  Input,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui'; // Importa todos os componentes UI do index.ts
import { useToast } from '../hooks/useToast'; // Caminho corrigido para useToast
import { API_BASE_URL } from '../../utils/api'; // Importa API_BASE_URL

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'orders', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(search && { search }),
        include: 'customer', // Include customer data for display
      });
      const response = await apiRequest<{ items: Order[]; total: number; totalPages: number }>(
        `/api/orders?${params.toString()}`
      );
      return response.data || { items: [], total: 0, totalPages: 0 };
    },
  });

  // Fetch single order details for modal
  const { data: orderDetails, isLoading: loadingOrderDetails } = useQuery({
    queryKey: ['admin', 'order', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return null;
      const response = await apiRequest<Order>(`/api/orders/${selectedOrder.id}?include=items,customer`);
      return response.data;
    },
    enabled: !!selectedOrder?.id,
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      if (!selectedOrder?.id) throw new Error('No order selected for update');
      return apiRequest<Order>(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify(orderData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedOrder?.id] });
      toast({ title: 'Pedido atualizado', description: 'O status do pedido foi atualizado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao atualizar pedido.', variant: 'destructive' });
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = (status: Order['status']) => {
    if (selectedOrder) {
      updateOrderMutation.mutate({ status });
    }
  };

  const handleUpdatePaymentStatus = (payment_status: Order['payment_status']) => {
    if (selectedOrder) {
      updateOrderMutation.mutate({ payment_status });
    }
  };

  const handleRefreshOrderDetails = () => {
    if (selectedOrder?.id) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedOrder.id] });
    }
  };

  const getStatusBadge = (statusValue: Order['status'] | Order['payment_status']) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let displayText: string;

    switch (statusValue) {
      case 'pending':
        variant = 'outline';
        displayText = 'Pendente';
        break;
      case 'paid':
        variant = 'default';
        displayText = 'Pago';
        break;
      case 'processing':
        variant = 'default';
        displayText = 'Processando';
        break;
      case 'shipped':
        variant = 'default';
        displayText = 'Enviado';
        break;
      case 'delivered':
        variant = 'default';
        displayText = 'Entregue';
        break;
      case 'cancelled':
        variant = 'destructive';
        displayText = 'Cancelado';
        break;
      case 'refunded':
        variant = 'destructive';
        displayText = 'Reembolsado';
        break;
      case 'failed':
        variant = 'destructive';
        displayText = 'Falhou';
        break;
      default:
        displayText = statusValue; // Fallback for any unhandled status
    }
    return <Badge variant={variant}>{displayText}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-2">Gerencie os pedidos dos seus clientes</p>
        </div>
        <Button onClick={() => refetch()} className="flex items-center gap-2" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar pedidos por número ou email do cliente..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-lg"
      />

      {/* Orders Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : !ordersData?.items || ordersData.items.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      {order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.email : order.email}
                    </TableCell>
                    <TableCell>{formatPrice(order.total_cents)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString('pt-PT')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {ordersData.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Página {page} de {ordersData.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(ordersData.totalPages, prev + 1))}
                    disabled={page === ordersData.totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detalhes do Pedido #{orderDetails?.order_number}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshOrderDetails}
                disabled={loadingOrderDetails}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrderDetails ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </DialogHeader>
          {loadingOrderDetails ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Carregando detalhes do pedido...</p>
            </div>
          ) : orderDetails ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
              {/* Order Summary */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Resumo do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={orderDetails.status}
                          onValueChange={(value: Order['status']) => handleUpdateStatus(value)}
                          disabled={updateOrderMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status do Pedido" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="refunded">Reembolsado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status do Pagamento</Label>
                        <Select
                          value={orderDetails.payment_status}
                          onValueChange={(value: Order['payment_status']) => handleUpdatePaymentStatus(value)}
                          disabled={updateOrderMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status do Pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="failed">Falhou</SelectItem>
                            <SelectItem value="refunded">Reembolsado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Subtotal</Label>
                        <p className="font-medium">{formatPrice(orderDetails.subtotal_cents)}</p>
                      </div>
                      <div>
                        <Label>Frete</Label>
                        <p className="font-medium">{formatPrice(orderDetails.shipping_cents)}</p>
                      </div>
                      <div>
                        <Label>Impostos</Label>
                        <p className="font-medium">{formatPrice(orderDetails.tax_cents)}</p>
                      </div>
                      <div>
                        <Label>Desconto</Label>
                        <p className="font-medium">{formatPrice(orderDetails.discount_cents)}</p>
                      </div>
                      <div className="col-span-2 border-t pt-2">
                        <Label className="text-lg">Total</Label>
                        <p className="text-2xl font-bold">{formatPrice(orderDetails.total_cents)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Itens do Pedido ({orderDetails.items?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderDetails.items && orderDetails.items.length > 0 ? (
                      <div className="space-y-4">
                        {orderDetails.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-md" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              {item.sku && <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>}
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x {formatPrice(item.price_cents)}
                              </p>
                            </div>
                            <p className="font-semibold">{formatPrice(item.total_cents)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum item neste pedido.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Customer & Shipping Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {orderDetails.customer ? (
                      <>
                        <p className="font-medium">
                          {orderDetails.customer.first_name} {orderDetails.customer.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{orderDetails.customer.email}</p>
                        {orderDetails.customer.phone && (
                          <p className="text-sm text-muted-foreground">{orderDetails.customer.phone}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Cliente não registrado</p>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {orderDetails.shipping_address_json ? (
                      (() => {
                        const address: Address = JSON.parse(orderDetails.shipping_address_json);
                        return (
                          <div className="text-sm">
                            <p className="font-medium">{address.first_name} {address.last_name}</p>
                            {address.company && <p>{address.company}</p>}
                            <p>{address.address_line1}</p>
                            {address.address_line2 && <p>{address.address_line2}</p>}
                            <p>{address.postal_code} {address.city}</p>
                            <p>{address.state}</p>
                            <p>{address.country}</p>
                            {address.phone && <p>Telefone: {address.phone}</p>}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-muted-foreground">Endereço de entrega não disponível.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Informações de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">
                      ID do Intent de Pagamento: <span className="font-medium">{orderDetails.stripe_payment_intent_id || 'N/A'}</span>
                    </p>
                    <p className="text-sm">
                      ID da Cobrança: <span className="font-medium">{orderDetails.stripe_charge_id || 'N/A'}</span>
                    </p>
                    <p className="text-sm">
                      Método de Pagamento: <span className="font-medium">Stripe</span>
                    </p>
                  </CardContent>
                </Card>

                {/* Invoice Link */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Fatura
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild>
                      <a href={`${API_BASE_URL}/api/orders/${orderDetails.id}/invoice`} target="_blank" rel="noopener noreferrer">
                        Ver Fatura
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Não foi possível carregar os detalhes do pedido.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
