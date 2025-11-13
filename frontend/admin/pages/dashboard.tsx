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
} from "lucide-react"
import { Button } from "../components/ui/button"
import { formatPrice } from "../../utils/format"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()

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
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true, // Atualizar quando voltar para a aba
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["admin", "dashboard", "sales"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Array<{ date: string; sales: number }>>("/api/admin/dashboard/sales-chart");
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
        const response = await apiRequest<Array<{ name: string; sales: number }>>("/api/admin/dashboard/top-products");
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const { data: channelData, isLoading: loadingChannels } = useQuery({
    queryKey: ["admin", "dashboard", "channels"],
    queryFn: async () => {
      // Por enquanto retornar dados vazios - pode ser implementado depois com tracking de origem
      return []
    },
  })

  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["admin", "dashboard", "recent-orders"],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: any[] }>("/api/orders?page=1&pageSize=5")
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
  }: {
    title: string
    value: number
    change?: number
    trend?: "up" | "down"
    icon: any
    format?: (v: number) => string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{format(value)}</div>
          {change !== undefined && (
            <p
              className={`text-xs flex items-center gap-1 mt-1 ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(change)}% em relação ao período anterior
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral das suas vendas e métricas
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loadingStats}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Vendas Hoje"
          value={stats?.salesToday || 0}
          change={stats?.salesTodayChange ? Math.abs(stats.salesTodayChange) : undefined}
          trend={stats?.salesTodayChange && stats.salesTodayChange >= 0 ? "up" : "down"}
          icon={Euro}
          format={(v) => formatPrice(Math.round(v * 100))}
        />
        <KpiCard
          title="Vendas do Mês"
          value={stats?.salesMonth || 0}
          change={stats?.salesMonthChange ? Math.abs(stats.salesMonthChange) : undefined}
          trend={stats?.salesMonthChange && stats.salesMonthChange >= 0 ? "up" : "down"}
          icon={TrendingUp}
          format={(v) => formatPrice(Math.round(v * 100))}
        />
        <KpiCard
          title="Pedidos Hoje"
          value={stats?.ordersToday || 0}
          change={stats?.ordersTodayChange ? Math.abs(stats.ordersTodayChange) : undefined}
          trend={stats?.ordersTodayChange && stats.ordersTodayChange >= 0 ? "up" : "down"}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Ticket Médio"
          value={stats?.averageTicket || 0}
          change={stats?.averageTicketChange ? Math.abs(stats.averageTicketChange) : undefined}
          trend={stats?.averageTicketChange && stats.averageTicketChange >= 0 ? "up" : "down"}
          icon={Package}
          format={(v) => formatPrice(Math.round(v * 100))}
        />
        <KpiCard
          title="Clientes Novos"
          value={stats?.customersNew || 0}
          icon={Users}
        />
        <KpiCard
          title="Total Clientes"
          value={stats?.customersTotal || 0}
          icon={Users}
        />
        <KpiCard
          title="Carrinhos Abandonados"
          value={stats?.abandonedCarts || 0}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Pedidos do Mês"
          value={stats?.ordersMonth || 0}
          change={stats?.ordersMonthChange ? Math.abs(stats.ordersMonthChange) : undefined}
          trend={stats?.ordersMonthChange && stats.ordersMonthChange >= 0 ? "up" : "down"}
          icon={Package}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSales ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name="Vendas (€)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 produtos</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#00C49F" name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Distribution & Recent Orders */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Canal</CardTitle>
            <CardDescription>Origem das vendas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChannels ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : channelData && channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData?.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Dados de distribuição por canal não disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos 5 pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Pedido #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(order.total_cents)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pedido recente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
