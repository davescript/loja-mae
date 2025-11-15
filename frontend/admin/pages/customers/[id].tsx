import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../../utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ArrowLeft, User, Mail, Phone, MapPin, ShoppingCart, Euro, Calendar } from 'lucide-react'
import { formatPrice } from '../../../utils/format'
import { motion } from 'framer-motion'
import type { Customer, Address, Order } from '@shared/types'

export default function AdminCustomerDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = id ? parseInt(id) : null

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['admin', 'customer', customerId],
    queryFn: async () => {
      if (!customerId) return null
      const response = await apiRequest<Customer & { addresses?: Address[] }>(
        `/api/customers/${customerId}`
      )
      return response.data
    },
    enabled: !!customerId,
  })

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'customer', customerId, 'orders'],
    queryFn: async () => {
      if (!customerId) return []
      const response = await apiRequest<{ items: Order[] }>(
        `/api/orders?customer_id=${customerId}&pageSize=20`
      )
      return response.data?.items || []
    },
    enabled: !!customerId,
  })

  if (loadingCustomer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando cliente...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">Cliente não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          O cliente que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => navigate('/admin/customers')}>
          Voltar para Clientes
        </Button>
      </div>
    )
  }

  const totalSpent = orders?.reduce((sum, order) => {
    if (order.payment_status === 'paid') {
      return sum + order.total_cents
    }
    return sum
  }, 0) || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/customers')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Cliente</h1>
            <p className="text-muted-foreground mt-1">
              Informações completas e histórico de pedidos
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nome</p>
              <p className="font-semibold">
                {customer.first_name && customer.last_name
                  ? `${customer.first_name} ${customer.last_name}`
                  : customer.first_name || customer.last_name || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </p>
              <p className="font-medium">{customer.email}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Membro desde
              </p>
              <p className="font-medium">
                {new Date(customer.created_at).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  customer.is_active === 1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {customer.is_active === 1 ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Pedidos</p>
              <p className="text-3xl font-bold">{orders?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Total Gasto
              </p>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
              <p className="text-xl font-semibold">
                {orders && orders.length > 0
                  ? formatPrice(Math.round(totalSpent / orders.length))
                  : formatPrice(0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereços
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-3">
                {customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {address.type === 'shipping'
                          ? 'Entrega'
                          : address.type === 'billing'
                          ? 'Cobrança'
                          : 'Ambos'}
                      </span>
                      {address.is_default === 1 && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {address.first_name} {address.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.postal_code} {address.city}
                    </p>
                    {address.state && (
                      <p className="text-sm text-muted-foreground">{address.state}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum endereço cadastrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders History */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>
            Todos os pedidos realizados por este cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        Pedido #{order.order_number}
                      </Link>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatPrice(order.total_cents)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

