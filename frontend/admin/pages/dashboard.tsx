import { useQuery } from "@tanstack/react-query"
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
} from "lucide-react"
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
  // Fetch dashboard data
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      // Mock data - substituir por chamada real à API
      return {
        salesToday: 1250.50,
        salesWeek: 8750.30,
        salesMonth: 32500.75,
        ordersToday: 12,
        ordersWeek: 89,
        ordersMonth: 342,
        customersNew: 23,
        customersTotal: 1245,
        averageTicket: 95.20,
        abandonedCarts: 8,
      }
    },
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["admin", "dashboard", "sales"],
    queryFn: async () => {
      // Mock data - substituir por chamada real
      return [
        { date: "Seg", sales: 1200 },
        { date: "Ter", sales: 1900 },
        { date: "Qua", sales: 1500 },
        { date: "Qui", sales: 2100 },
        { date: "Sex", sales: 1800 },
        { date: "Sáb", sales: 2400 },
        { date: "Dom", sales: 2200 },
      ]
    },
  })

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin", "dashboard", "top-products"],
    queryFn: async () => {
      // Mock data
      return [
        { name: "Produto A", sales: 45 },
        { name: "Produto B", sales: 32 },
        { name: "Produto C", sales: 28 },
        { name: "Produto D", sales: 22 },
        { name: "Produto E", sales: 18 },
      ]
    },
  })

  const { data: channelData, isLoading: loadingChannels } = useQuery({
    queryKey: ["admin", "dashboard", "channels"],
    queryFn: async () => {
      // Mock data
      return [
        { name: "Orgânico", value: 45 },
        { name: "Social", value: 25 },
        { name: "Anúncios", value: 20 },
        { name: "E-mail", value: 10 },
      ]
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
  })

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral das suas vendas e métricas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Vendas Hoje"
          value={stats?.salesToday || 0}
          change={12.5}
          trend="up"
          icon={Euro}
          format={(v) => formatPrice(Math.round(v * 100))}
        />
        <KpiCard
          title="Vendas do Mês"
          value={stats?.salesMonth || 0}
          change={8.2}
          trend="up"
          icon={TrendingUp}
          format={(v) => formatPrice(Math.round(v * 100))}
        />
        <KpiCard
          title="Pedidos Hoje"
          value={stats?.ordersToday || 0}
          change={-3.1}
          trend="down"
          icon={ShoppingCart}
        />
        <KpiCard
          title="Ticket Médio"
          value={stats?.averageTicket || 0}
          change={5.4}
          trend="up"
          icon={Package}
          format={(v) => formatPrice(Math.round(v * 100))}
        />
        <KpiCard
          title="Clientes Novos"
          value={stats?.customersNew || 0}
          change={15.3}
          trend="up"
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
          change={-12.5}
          trend="down"
          icon={ShoppingCart}
        />
        <KpiCard
          title="Pedidos do Mês"
          value={stats?.ordersMonth || 0}
          change={18.7}
          trend="up"
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
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
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
