import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../../utils/api';
import { formatPrice } from '../../../../utils/format';
import { Order, OrderItem } from '../../../../../shared/types';
import { motion } from 'framer-motion';
import { 
  Package, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin,
  CreditCard,
  HeadphonesIcon,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../admin/components/ui/card';
import { Badge } from '../../../../admin/components/ui/badge';
import { Button } from '../../../../admin/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type OrderStatusHistory = {
  id: number;
  order_id: number;
  status: string;
  payment_status: string | null;
  fulfillment_status: string | null;
  notes: string | null;
  created_at: string;
};

type OrderWithHistory = Order & {
  status_history?: OrderStatusHistory[];
  tracking_number?: string;
  tracking_url?: string;
  shipping_carrier?: string;
  shipping_method?: string;
  shipped_at?: string;
  delivered_at?: string;
};

export default function CustomerOrderDetailsPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['customer-order', orderNumber],
    queryFn: async () => {
      const response = await apiRequest<OrderWithHistory>(`/api/customers/orders/${orderNumber}`);
      return response.data as OrderWithHistory;
    },
    enabled: !!orderNumber,
    staleTime: 0, // Always fetch fresh data for order details
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-64" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pedido não encontrado</h2>
        <p className="text-muted-foreground mb-4">O pedido que você está procurando não existe.</p>
        <Button onClick={() => navigate('/account/orders')}>Voltar para Pedidos</Button>
      </div>
    );
  }

  const shippingAddress = order.shipping_address_json 
    ? (typeof order.shipping_address_json === 'string' 
        ? JSON.parse(order.shipping_address_json) 
        : order.shipping_address_json)
    : null;

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

  // Timeline steps - usar order_status_history se disponível, senão usar lógica baseada no status atual
  const timelineSteps = (() => {
    // Se temos histórico, usar ele
    if (order.status_history && order.status_history.length > 0) {
      const statusMap: Record<string, { label: string; icon: any }> = {
        pending: { label: 'Pedido Recebido', icon: Package },
        paid: { label: 'Pagamento Confirmado', icon: CheckCircle2 },
        processing: { label: 'Preparando Pedido', icon: Clock },
        shipped: { label: 'Pedido Enviado', icon: Truck },
        delivered: { label: 'Pedido Entregue', icon: CheckCircle2 },
        cancelled: { label: 'Pedido Cancelado', icon: XCircle },
        refunded: { label: 'Pedido Reembolsado', icon: XCircle },
      };

      return order.status_history.map((history, index) => {
        const config = statusMap[history.status] || { label: history.status, icon: Package };
        const Icon = config.icon;
        const isLast = index === order.status_history!.length - 1;
        
        return {
          key: `${history.status}-${index}`,
          label: config.label,
          icon: Icon,
          active: isLast,
          completed: true,
          date: history.created_at,
          notes: history.notes,
        };
      });
    }

    // Fallback: timeline baseada no status atual
    return [
      {
        key: 'received',
        label: 'Pedido Recebido',
        icon: Package,
        active: true,
        completed: true,
        date: order.created_at,
      },
      {
        key: 'payment',
        label: 'Pagamento Confirmado',
        icon: CheckCircle2,
        active: order.payment_status === 'paid',
        completed: order.payment_status === 'paid',
        date: order.payment_status === 'paid' ? order.updated_at : null,
      },
      {
        key: 'processing',
        label: 'Preparando Pedido',
        icon: Clock,
        active: order.status === 'processing',
        completed: ['processing', 'shipped', 'delivered'].includes(order.status),
        date: order.status === 'processing' ? order.updated_at : null,
      },
      {
        key: 'shipped',
        label: 'Pedido Enviado',
        icon: Truck,
        active: order.status === 'shipped',
        completed: ['shipped', 'delivered'].includes(order.status),
        date: order.shipped_at || (order.status === 'shipped' ? order.updated_at : null),
      },
      {
        key: 'delivered',
        label: 'Pedido Entregue',
        icon: CheckCircle2,
        active: order.status === 'delivered',
        completed: order.status === 'delivered',
        date: order.delivered_at || (order.status === 'delivered' ? order.updated_at : null),
      },
    ];
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/account/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pedido {order.order_number}</h1>
            <p className="text-muted-foreground">
              Realizado em {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(order.status)}
          <Button
            variant="outline"
            onClick={async () => {
              const { downloadInvoicePDF } = await import('../../../../utils/invoice');
              await downloadInvoicePDF(order.id);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Fatura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Acompanhamento do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === timelineSteps.length - 1;
                  const isActive = step.active;
                  const isCompleted = step.completed;
                  const hasNotes = 'notes' in step && step.notes;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-primary text-primary-foreground'
                              : isActive
                              ? 'bg-primary/20 text-primary border-2 border-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 ${
                              isCompleted ? 'bg-primary' : 'bg-muted'
                            }`}
                            style={{ minHeight: '40px' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`font-medium ${
                              isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </h3>
                          {step.date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(step.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                          {'notes' in step && step.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {step.notes}
                            </div>
                          )}
                        </div>
                        {isActive && !isCompleted && (
                          <p className="text-sm text-muted-foreground">Em andamento...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: OrderItem) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.total_cents)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price_cents)} cada
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle>Rastreamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transportadora</p>
                    <p className="font-medium">{order.shipping_carrier || 'Não especificada'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Número de Rastreamento</p>
                    <p className="font-mono font-medium">{order.tracking_number}</p>
                  </div>
                  {order.tracking_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(order.tracking_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Acompanhar Envio
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal_cents)}</span>
              </div>
              {order.shipping_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Portes</span>
                  <span>{formatPrice(order.shipping_cents)}</span>
                </div>
              )}
              {order.tax_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatPrice(order.tax_cents)}</span>
                </div>
              )}
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{formatPrice(order.discount_cents)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total_cents)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {shippingAddress.first_name} {shippingAddress.last_name}
                  </p>
                  <p>{shippingAddress.address_line1 || shippingAddress.street}</p>
                  {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                  <p>
                    {shippingAddress.postal_code} {shippingAddress.city}
                  </p>
                  {shippingAddress.state && <p>{shippingAddress.state}</p>}
                  <p>{shippingAddress.country}</p>
                  {shippingAddress.phone && <p className="mt-2">{shippingAddress.phone}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {order.stripe_payment_intent_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {order.payment_status === 'paid' ? 'Confirmado' : 'Pendente'}
                    </p>
                  </div>
                  {order.stripe_charge_id && (
                    <div>
                      <p className="text-muted-foreground">ID da Transação</p>
                      <p className="font-mono text-xs">{order.stripe_charge_id}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <HeadphonesIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                <h3 className="font-medium">Precisa de Ajuda?</h3>
                <p className="text-sm text-muted-foreground">
                  Entre em contato com nosso suporte
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/account/support', { state: { orderNumber: order.order_number } })}
                >
                  Abrir Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

