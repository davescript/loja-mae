import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "../../utils/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Euro,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { formatPrice } from "../../utils/format"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useAdminAuth } from "../../hooks/useAdminAuth"
import { API_BASE_URL } from "../../utils/api"
import { Link } from "react-router-dom"

const COLORS = {
  primary: "#0088FE",
  success: "#00C49F",
  warning: "#FFBB28",
  danger: "#FF8042",
  purple: "#8884d8",
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const { admin } = useAdminAuth()

  // Fetch dashboard data
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      const response = await apiRequest<{
        salesToday: number;
        salesTodayChange: number;
        salesMonth: number;
        salesMonthChange: number;
        ordersToday: number;
        ordersTodayChange: number;
        ordersMonth: number;
        ordersMonthChange: number;
        customersNew: number;
        customersTotal: number;
        averageTicket: number;
        averageTicketChange: number;
        abandonedCarts: number;
      }>("/api/admin/dashboard/stats");
      return response.data || {
        salesToday: 0,
        salesTodayChange: 0,
        salesMonth: 0,
        salesMonthChange: 0,
        ordersToday: 0,
        ordersTodayChange: 0,
        ordersMonth: 0,
        ordersMonthChange: 0,
        customersNew: 0,
        customersTotal: 0,
        averageTicket: 0,
        averageTicketChange: 0,
        abandonedCarts: 0,
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["admin", "dashboard", "sales"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Array<{ date: string; orders: number; revenue: number }>>("/api/admin/dashboard/sales-chart");
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin", "dashboard", "top-products"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Array<{ id: number; name: string; sku: string; sales: number; image_url: string | null }>>("/api/admin/dashboard/top-products");
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const { data: topCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["admin", "dashboard", "top-customers"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Array<{ id: number; name: string; email: string; orders: number }>>("/api/admin/dashboard/top-customers");
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["admin", "dashboard", "recent-orders"],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: any[] }>("/api/orders?page=1&pageSize=5&sortBy=created_at&sortOrder=desc")
        return response.data?.items || []
      } catch {
        return []
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
    refetchStats()
  }

  const KpiCard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    format = (v: any) => v,
    color = "primary",
  }: {
    title: string
    value: number
    change?: number
    trend?: "up" | "down"
    icon: any
    format?: (v: number) => string
    color?: keyof typeof COLORS
  }) => {
    const isPositive = trend === "up"
    const changeValue = change !== undefined ? Math.abs(change) : 0
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10`} style={{ backgroundColor: COLORS[color] }} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS[color]}15` }}>
              <Icon className="h-5 w-5" style={{ color: COLORS[color] }} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-2">{format(value)}</div>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {changeValue.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {isPositive ? 'aumento' : 'redução'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

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
    <div className="space-y-6 p-6 bg-white">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Bem-vindo de volta, {admin?.name || admin?.email?.split('@')[0] || 'Admin'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Aqui está o que está acontecendo com sua loja hoje
        </p>
      </motion.div>

      {/* KPI Cards - Top 5 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Receita E-commerce"
          value={stats?.salesMonth || 0}
          change={stats?.salesMonthChange}
          trend={stats?.salesMonthChange && stats.salesMonthChange >= 0 ? "up" : "down"}
          icon={Euro}
          format={(v) => formatPrice(Math.round(v * 100))}
          color="primary"
        />
        <KpiCard
          title="Novos Clientes"
          value={stats?.customersNew || 0}
          change={stats?.customersNew && stats.customersTotal ? ((stats.customersNew / stats.customersTotal) * 100) : undefined}
          trend="up"
          icon={Users}
          color="success"
        />
        <KpiCard
          title="Taxa de Recompra"
          value={stats?.ordersMonth && stats.customersTotal ? (stats.ordersMonth / stats.customersTotal * 100) : 0}
          change={25.4}
          trend="up"
          icon={TrendingUp}
          format={(v) => `${v.toFixed(2)}%`}
          color="purple"
        />
        <KpiCard
          title="Ticket Médio"
          value={stats?.averageTicket || 0}
          change={stats?.averageTicketChange}
          trend={stats?.averageTicketChange && stats.averageTicketChange >= 0 ? "up" : "down"}
          icon={Package}
          format={(v) => formatPrice(Math.round(v * 100))}
          color="warning"
        />
        <KpiCard
          title="Taxa de Conversão"
          value={stats?.ordersToday && stats.customersTotal ? (stats.ordersToday / stats.customersTotal * 100) : 0}
          change={-12.42}
          trend="down"
          icon={ShoppingCart}
          format={(v) => `${v.toFixed(2)}%`}
          color="danger"
        />
      </div>

      {/* Summary Chart */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Resumo</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </div>
          <select className="px-3 py-1.5 border rounded-md text-sm">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Este mês</option>
            <option>Ano anterior</option>
          </select>
        </CardHeader>
        <CardContent>
          {loadingSales ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Pedidos') return value
                    return formatPrice(Math.round(value * 100))
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  name="Pedidos"
                  dot={{ fill: COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  name="Crescimento de Receita"
                  dot={{ fill: COLORS.success, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Most Selling Products & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Selling Products */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top produtos dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.image_url ? (
                        <img 
                          src={product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">ID: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{product.sales}</p>
                      <p className="text-xs text-muted-foreground">vendas</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Nenhum produto vendido ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Pedidos Recentes</CardTitle>
              <CardDescription>Últimos pedidos recebidos</CardDescription>
            </div>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any, index: number) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">Pedido #{order.order_number}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.name || order.email || 'Cliente'} • {new Date(order.created_at).toLocaleDateString("pt-PT", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold">{formatPrice(order.total_cents)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Nenhum pedido recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Top Customers */}
      {topCustomers && topCustomers.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Top Clientes da Semana</CardTitle>
            <CardDescription>Clientes com mais pedidos nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCustomers ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {topCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center p-4 rounded-lg border hover:bg-gray-50 transition-colors bg-white"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3">
                      <span className="text-2xl font-bold text-primary">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-center mb-1 truncate w-full">{customer.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{customer.orders} pedidos</p>
                    <Link to={`/admin/customers/${customer.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Ver
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
