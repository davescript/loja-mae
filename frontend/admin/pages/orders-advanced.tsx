import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "../../utils/api"
import { DataTable, type Column } from "../components/common/DataTable"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { formatPrice } from "../../utils/format"
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "../hooks/useToast"

type Order = {
  id: number
  order_number: string
  status: string
  payment_status: string
  total_cents: number
  created_at: string
  updated_at?: string
  customer_id?: number | null
  email: string
  stripe_payment_intent_id?: string | null
  customer?: {
    id: number
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pago", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Em Preparação", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

export default function AdminOrdersPageAdvanced() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString())

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin", "orders", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      })
      const response = await apiRequest<{ items: Order[]; total: number; totalPages: number }>(
        `/api/orders?${params.toString()}`
      )
      const data = response.data || { items: [], total: 0, totalPages: 0 }
      
      // Atualizar lastUpdatedAt quando receber novos dados
      if (data.items && data.items.length > 0) {
        const latestUpdate = data.items.reduce((latest, order) => {
          const orderDate = new Date(order.updated_at || order.created_at)
          return orderDate > latest ? orderDate : latest
        }, new Date(0))
        setLastUpdatedAt(latestUpdate.toISOString())
      }
      
      return data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })

  // Polling para atualizações em tempo real
  const { data: orderUpdates } = useQuery({
    queryKey: ["admin", "orders", "updates", lastUpdatedAt],
    queryFn: async () => {
      const params = new URLSearchParams({
        lastUpdatedAt,
        limit: "10",
      })
      const response = await apiRequest<{ orders: Order[]; count: number; lastUpdatedAt: string }>(
        `/api/admin/orders/updates?${params.toString()}`
      )
      return response.data
    },
    enabled: !!lastUpdatedAt,
    refetchInterval: 15000, // Polling a cada 15 segundos
  })

  // Efeito para mostrar toasts quando houver atualizações
  useEffect(() => {
    if (orderUpdates && orderUpdates.orders && orderUpdates.orders.length > 0) {
      // Mostrar toast para novos pedidos pagos
      const paidOrders = orderUpdates.orders.filter((o: Order) => o.payment_status === 'paid')
      paidOrders.forEach((order: Order) => {
        toast({
          title: 'Novo pedido pago!',
          description: `Pedido #${order.order_number} foi pago`,
        })
      })
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] })
    }
  }, [orderUpdates, toast, queryClient])

  const syncPaymentMutation = useMutation({
    mutationFn: async ({ orderId, orderNumber, paymentIntentId }: { orderId?: number; orderNumber?: string; paymentIntentId?: string }) => {
      const params = new URLSearchParams()
      if (orderId) params.append('order_id', orderId.toString())
      if (orderNumber) params.append('order_number', orderNumber)
      if (paymentIntentId) params.append('payment_intent_id', paymentIntentId)
      
      const response = await apiRequest<{ message: string; payment_status: string; status: string }>(
        `/api/orders/sync-payment?${params.toString()}`,
        { method: 'POST' }
      )
      return response.data
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: 'Status sincronizado',
          description: data.message || 'Status do pagamento atualizado com sucesso',
        })
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] })
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ["admin", "order", selectedOrder.id] })
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao sincronizar',
        description: error.message || 'Não foi possível sincronizar o status do pagamento',
        variant: 'destructive',
      })
    },
  })

  const { data: orderDetails } = useQuery({
    queryKey: ["admin", "order", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return null
      const response = await apiRequest<Order>(`/api/orders/${selectedOrder.id}`)
      return response.data
    },
    enabled: !!selectedOrder,
  })

  const columns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Pedido",
      sortable: true,
      accessor: (order) => (
        <div>
          <div className="font-medium">#{order.order_number}</div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      accessor: (order) => (
        <div>
          <div className="font-medium">
            {order.customer?.first_name || order.customer?.last_name
              ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
              : order.email || "Cliente"}
          </div>
          <div className="text-sm text-muted-foreground">{order.customer?.email || order.email || ""}</div>
        </div>
      ),
    },
    {
      key: "total_cents",
      header: "Total",
      sortable: true,
      accessor: (order) => <div className="font-semibold">{formatPrice(order.total_cents)}</div>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (order) => {
        const config = statusConfig[order.status] || statusConfig.pending
        const Icon = config.icon
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: "payment_status",
      header: "Pagamento",
      accessor: (order) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            order.payment_status === "paid"
              ? "bg-green-100 text-green-800"
              : order.payment_status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {order.payment_status === "paid" ? "Pago" : order.payment_status === "pending" ? "Pendente" : "Falhou"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      accessor: (order) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedOrder(order)
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {order.payment_status === 'pending' && order.stripe_payment_intent_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                syncPaymentMutation.mutate({ 
                  orderId: order.id,
                  orderNumber: order.order_number,
                  paymentIntentId: order.stripe_payment_intent_id || undefined
                })
              }}
              disabled={syncPaymentMutation.isPending}
              title="Sincronizar status do pagamento"
            >
              <RefreshCw className={`w-4 h-4 ${syncPaymentMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-2">Gerencie pedidos e entregas</p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] })}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos os Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={ordersData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar por número de pedido ou email..."
        onSearch={setSearch}
        pagination={
          ordersData
            ? {
                page,
                pageSize: 20,
                total: ordersData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        onRowClick={(order) => setSelectedOrder(order)}
      />

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>Detalhes completos do pedido</DialogDescription>
          </DialogHeader>

          {orderDetails && (
            <div className="space-y-6">
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Status do Pedido
                    {orderDetails.payment_status === 'pending' && orderDetails.stripe_payment_intent_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncPaymentMutation.mutate({ 
                          orderId: orderDetails.id,
                          orderNumber: orderDetails.order_number,
                          paymentIntentId: orderDetails.stripe_payment_intent_id || undefined
                        })}
                        disabled={syncPaymentMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncPaymentMutation.isPending ? 'animate-spin' : ''}`} />
                        Sincronizar Pagamento
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <div className="font-medium">Pedido criado</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(orderDetails.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    {orderDetails.payment_status === 'paid' && (
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-medium">Pagamento confirmado</div>
                          <div className="text-sm text-muted-foreground">
                            Status: {orderDetails.payment_status}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Itens serão carregados aqui</p>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Nome: </span>
                      <span className="text-sm">
                        {orderDetails.customer?.first_name || orderDetails.customer?.last_name
                          ? `${orderDetails.customer.first_name || ''} ${orderDetails.customer.last_name || ''}`.trim()
                          : orderDetails.email || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Email: </span>
                      <span className="text-sm">{orderDetails.customer?.email || orderDetails.email || "N/A"}</span>
                    </div>
                    {orderDetails.customer?.phone && (
                      <div>
                        <span className="text-sm font-medium">Telefone: </span>
                        <span className="text-sm">{orderDetails.customer.phone}</span>
                      </div>
                    )}
                    {orderDetails.customer_id && (
                      <div>
                        <span className="text-sm font-medium">ID Cliente: </span>
                        <span className="text-sm">#{orderDetails.customer_id}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {orderDetails.shipping_address_json && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      try {
                        const shippingAddress = typeof orderDetails.shipping_address_json === 'string'
                          ? JSON.parse(orderDetails.shipping_address_json)
                          : orderDetails.shipping_address_json;
                        
                        return (
                          <div className="space-y-2 text-sm">
                            {(shippingAddress.first_name || shippingAddress.last_name) && (
                              <div>
                                <span className="font-medium">Nome: </span>
                                <span>{shippingAddress.first_name || ''} {shippingAddress.last_name || ''}</span>
                              </div>
                            )}
                            {shippingAddress.company && (
                              <div>
                                <span className="font-medium">Empresa: </span>
                                <span>{shippingAddress.company}</span>
                              </div>
                            )}
                            {shippingAddress.address_line1 && (
                              <div>
                                <span className="font-medium">Endereço: </span>
                                <span>{shippingAddress.address_line1}</span>
                              </div>
                            )}
                            {shippingAddress.address_line2 && (
                              <div className="pl-4">
                                <span>{shippingAddress.address_line2}</span>
                              </div>
                            )}
                            {(shippingAddress.city || shippingAddress.postal_code) && (
                              <div>
                                <span className="font-medium">Cidade/CEP: </span>
                                <span>
                                  {shippingAddress.postal_code || ''} {shippingAddress.city || ''}
                                </span>
                              </div>
                            )}
                            {shippingAddress.state && (
                              <div>
                                <span className="font-medium">Distrito: </span>
                                <span>{shippingAddress.state}</span>
                              </div>
                            )}
                            {shippingAddress.country && (
                              <div>
                                <span className="font-medium">País: </span>
                                <span>{shippingAddress.country}</span>
                              </div>
                            )}
                            {shippingAddress.phone && (
                              <div>
                                <span className="font-medium">Telefone: </span>
                                <span>{shippingAddress.phone}</span>
                              </div>
                            )}
                          </div>
                        );
                      } catch (err) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Erro ao carregar endereço
                          </p>
                        );
                      }
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Total */}
              <Card>
                <CardHeader>
                  <CardTitle>Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(orderDetails.total_cents)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

