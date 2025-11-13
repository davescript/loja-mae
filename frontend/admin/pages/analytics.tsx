import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../../utils/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Users, ShoppingCart, Euro } from "lucide-react"
import { formatPrice } from "../../utils/format"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin", "analytics", "stats"],
    queryFn: async () => {
      try {
        const response = await apiRequest<{
          totalRevenue: number;
          totalRevenueChange: number;
          totalOrders: number;
          totalOrdersChange: number;
          totalCustomers: number;
          totalCustomersChange: number;
          conversionRate: number;
          conversionRateChange: number;
        }>("/api/admin/analytics/stats");
        return response.data || {
          totalRevenue: 0,
          totalRevenueChange: 0,
          totalOrders: 0,
          totalOrdersChange: 0,
          totalCustomers: 0,
          totalCustomersChange: 0,
          conversionRate: 0,
          conversionRateChange: 0,
        };
      } catch {
        return {
          totalRevenue: 0,
          totalRevenueChange: 0,
          totalOrders: 0,
          totalOrdersChange: 0,
          totalCustomers: 0,
          totalCustomersChange: 0,
          conversionRate: 0,
          conversionRateChange: 0,
        };
      }
    },
  })

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["admin", "analytics", "revenue"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Array<{ month: string; value: number }>>("/api/admin/analytics/revenue-chart");
        return response.data || [];
      } catch {
        return [];
      }
    },
  })

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin", "analytics", "top-products"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Array<{ name: string; sales: number }>>("/api/admin/analytics/top-products");
        return response.data || [];
      } catch {
        return [];
      }
    },
  })

  const isLoading = loadingStats || loadingRevenue || loadingProducts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Análise detalhada do desempenho da loja</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Math.round((stats?.totalRevenue || 0) * 100))}</div>
            <p className={`text-xs ${stats?.totalRevenueChange && stats.totalRevenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.totalRevenueChange !== undefined && stats.totalRevenueChange !== 0
                ? `${stats.totalRevenueChange >= 0 ? '+' : ''}${stats.totalRevenueChange.toFixed(1)}% desde o mês passado`
                : 'Sem dados do mês anterior'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders?.toLocaleString('pt-PT') || 0}</div>
            <p className={`text-xs ${stats?.totalOrdersChange && stats.totalOrdersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.totalOrdersChange !== undefined && stats.totalOrdersChange !== 0
                ? `${stats.totalOrdersChange >= 0 ? '+' : ''}${stats.totalOrdersChange.toFixed(1)}% desde o mês passado`
                : 'Sem dados do mês anterior'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers?.toLocaleString('pt-PT') || 0}</div>
            <p className={`text-xs ${stats?.totalCustomersChange && stats.totalCustomersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.totalCustomersChange !== undefined && stats.totalCustomersChange !== 0
                ? `${stats.totalCustomersChange >= 0 ? '+' : ''}${stats.totalCustomersChange.toFixed(1)}% desde o mês passado`
                : 'Sem dados do mês anterior'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalOrders || 0} pedidos / {stats?.totalCustomers || 0} clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} name="Receita (€)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados de receita disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 4 produtos por vendas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : topProducts && topProducts.length > 0 ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados de produtos disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fontes de Tráfego</CardTitle>
          <CardDescription>Distribuição do tráfego por origem</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Dados de fontes de tráfego não disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

