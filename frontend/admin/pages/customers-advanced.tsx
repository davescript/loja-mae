import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../../utils/api"
import { DataTable, type Column } from "../components/common/DataTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { formatPrice } from "../../utils/format"
import { Eye, Mail, Phone, MapPin, ShoppingCart, Euro, Edit, Save, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Address } from "@shared/types"

type Customer = {
  id: number
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  created_at: string
  total_spent?: number
  orders_count?: number
  addresses?: Address[]
}

export default function AdminCustomersPageAdvanced() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["admin", "customers", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(search && { search }),
      })
      const response = await apiRequest<{ items: Customer[]; total: number; totalPages: number }>(
        `/api/customers?${params.toString()}`
      )
      return response.data || { items: [], total: 0, totalPages: 0 }
    },
  })

  const { data: customerDetails } = useQuery({
    queryKey: ["admin", "customer", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return null
      const response = await apiRequest<Customer>(`/api/customers/${selectedCustomer.id}`)
      return response.data
    },
    enabled: !!selectedCustomer,
  })

  const { data: customerOrders } = useQuery({
    queryKey: ["admin", "customer", selectedCustomer?.id, "orders"],
    queryFn: async () => {
      if (!selectedCustomer) return []
      const response = await apiRequest<{ items: any[] }>(`/api/orders?customer_id=${selectedCustomer.id}`)
      return response.data?.items || []
    },
    enabled: !!selectedCustomer,
  })

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Cliente",
      accessor: (customer) => (
        <div>
          <div className="font-medium">
            {customer.first_name && customer.last_name
              ? `${customer.first_name} ${customer.last_name}`
              : customer.email}
          </div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      accessor: (customer) => customer.phone || "—",
    },
    {
      key: "orders_count",
      header: "Pedidos",
      sortable: true,
      accessor: (customer) => customer.orders_count || 0,
    },
    {
      key: "total_spent",
      header: "Total Gasto",
      sortable: true,
      accessor: (customer) => formatPrice(customer.total_spent ? customer.total_spent * 100 : 0),
    },
    {
      key: "created_at",
      header: "Membro Desde",
      sortable: true,
      accessor: (customer) =>
        format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR }),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus clientes e histórico</p>
        </div>
      </div>

      <DataTable
        data={customersData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar por nome ou email..."
        onSearch={setSearch}
        pagination={
          customersData
            ? {
                page,
                pageSize: 20,
                total: customersData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        onRowClick={(customer) => setSelectedCustomer(customer)}
        actions={(customer) => (
          <button
            onClick={() => setSelectedCustomer(customer)}
            className="text-primary hover:text-primary/80"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* Customer Details Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer?.first_name && selectedCustomer?.last_name
                ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
                : selectedCustomer?.email}
            </DialogTitle>
            <DialogDescription>Detalhes completos do cliente</DialogDescription>
          </DialogHeader>

          {customerDetails && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="addresses">Endereços</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">{customerDetails.email}</div>
                      </div>
                    </div>
                    {customerDetails.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Telefone</div>
                          <div className="text-sm text-muted-foreground">{customerDetails.phone}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Total de Pedidos</div>
                        <div className="text-sm text-muted-foreground">{customerDetails.orders_count || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Total Gasto</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(customerDetails.total_spent ? customerDetails.total_spent * 100 : 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerOrders && customerOrders.length > 0 ? (
                      <div className="space-y-4">
                        {customerOrders.map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">Pedido #{order.order_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatPrice(order.total_cents)}</div>
                              <div className="text-sm text-muted-foreground">{order.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Endereços</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerDetails.addresses && customerDetails.addresses.length > 0 ? (
                      <div className="space-y-4">
                        {customerDetails.addresses.map((address: Address) => (
                          <div key={address.id} className="flex items-start gap-3 p-4 border rounded-lg">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  {address.first_name} {address.last_name}
                                </span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {address.type === 'shipping' ? 'Entrega' : address.type === 'billing' ? 'Cobrança' : 'Ambos'}
                                </span>
                                {address.is_default ? (
                                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                    Padrão
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {address.company && <div>{address.company}</div>}
                                <div>{address.address_line1}</div>
                                {address.address_line2 && <div>{address.address_line2}</div>}
                                <div>{address.city}, {address.state} {address.postal_code}</div>
                                <div>{address.country}</div>
                                {address.phone && <div>Tel: {address.phone}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
