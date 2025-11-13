import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { apiRequest } from "../../utils/api"
import { DataTable, type Column } from "../components/common/DataTable"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useToast } from "../hooks/useToast"
import { Plus, Edit, Trash2, MoreVertical, Copy, CheckCircle2, XCircle } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { validateDateRange } from "../../utils/validateDates"

// Coupon schema for validation
const couponSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").max(50, "Código muito longo"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().min(0.01, "Valor do desconto deve ser maior que zero"),
  minimum_amount: z.number().min(0).optional().nullable(),
  maximum_amount: z.number().min(0).optional().nullable(),
  expires_at: z.string().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  usage_limit: z.number().min(1).optional().nullable(),
  usage_limit_per_user: z.number().min(1).optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  if (data.expires_at && data.starts_at) {
    return new Date(data.starts_at) < new Date(data.expires_at);
  }
  return true;
}, {
  message: "Data de início deve ser anterior à data de término",
  path: ["expires_at"],
});

type CouponFormData = z.infer<typeof couponSchema>

type Coupon = {
  id: number
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  minimum_amount?: number
  expires_at?: string
  usage_limit?: number
  usage_count: number
  is_active: boolean
}

export default function AdminCouponsPageAdvanced() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ["admin", "coupons", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(search && { search }),
      })
      const response = await apiRequest<{ items: Coupon[]; total: number; totalPages: number }>(
        `/api/coupons?${params.toString()}`
      )
      return response.data || { items: [], total: 0, totalPages: 0 }
    },
  })

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Código",
      sortable: true,
      accessor: (coupon) => (
        <div>
          <div className="font-medium font-mono">{coupon.code}</div>
          <div className="text-sm text-muted-foreground">
            {coupon.discount_type === "percentage"
              ? `${coupon.discount_value}% OFF`
              : `${coupon.discount_value}€ OFF`}
          </div>
        </div>
      ),
    },
    {
      key: "discount_value",
      header: "Desconto",
      accessor: (coupon) =>
        coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `€${coupon.discount_value}`,
    },
    {
      key: "usage_count",
      header: "Usos",
      accessor: (coupon) => (
        <div>
          <div>{coupon.usage_count || 0}</div>
          {coupon.usage_limit && (
            <div className="text-sm text-muted-foreground">de {coupon.usage_limit}</div>
          )}
        </div>
      ),
    },
    {
      key: "expires_at",
      header: "Validade",
      accessor: (coupon) =>
        coupon.expires_at
          ? format(new Date(coupon.expires_at), "dd/MM/yyyy", { locale: ptBR })
          : "Sem validade",
    },
    {
      key: "is_active",
      header: "Status",
      accessor: (coupon) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            coupon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {coupon.is_active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Código do cupom copiado para a área de transferência",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cupons</h1>
          <p className="text-muted-foreground mt-2">Gerencie cupons de desconto e promoções</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponsData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {couponsData?.items?.filter((c) => c.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {couponsData?.items?.reduce((sum, c) => sum + (c.usage_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Expirados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {couponsData?.items?.filter((c) => c.expires_at && new Date(c.expires_at) < new Date()).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={couponsData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar cupons..."
        onSearch={setSearch}
        pagination={
          couponsData
            ? {
                page,
                pageSize: 20,
                total: couponsData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        actions={(coupon) => (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="bg-white rounded-md shadow-lg border p-1 min-w-[150px]">
                <DropdownMenu.Item
                  className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setEditingCoupon(coupon)
                    setIsModalOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2"
                  onClick={() => copyToClipboard(coupon.code)}
                >
                  <Copy className="w-4 h-4" />
                  Copiar Código
                </DropdownMenu.Item>
                <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2 text-red-600">
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      />

      {/* Coupon Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? "Atualize o cupom de desconto" : "Crie um novo cupom de desconto"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="restricoes">Restrições</TabsTrigger>
              <TabsTrigger value="uso">Uso e Limites</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Código do Cupom *</Label>
                <div className="flex gap-2">
                  <Input id="coupon-code" placeholder="DESCONTO10" className="font-mono flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const randomCode = `CUPOM${Math.floor(Math.random() * 10000)}`
                      const input = document.getElementById("coupon-code") as HTMLInputElement
                      if (input) input.value = randomCode
                    }}
                  >
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Código único que os clientes usarão no checkout</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Tipo de Desconto *</Label>
                  <Select defaultValue="percentage">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">Valor do Desconto *</Label>
                  <Input id="discount-value" type="number" placeholder="10" />
                  <p className="text-xs text-muted-foreground">Percentual ou valor em euros</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-description">Descrição</Label>
                <Textarea id="coupon-description" rows={3} placeholder="Descrição do cupom (opcional)" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-status">Status</Label>
                <Select defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="restricoes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="minimum-amount">Valor Mínimo do Pedido (€)</Label>
                <Input id="minimum-amount" type="number" placeholder="50" />
                <p className="text-xs text-muted-foreground">Valor mínimo que o pedido deve ter para usar o cupom</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximum-amount">Valor Máximo do Desconto (€)</Label>
                <Input id="maximum-amount" type="number" placeholder="100" />
                <p className="text-xs text-muted-foreground">Limite máximo de desconto (apenas para percentual)</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Restrições por Categoria</CardTitle>
                  <CardDescription>Limite o cupom a categorias específicas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Funcionalidade será implementada aqui</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Restrições por Produto</CardTitle>
                  <CardDescription>Limite o cupom a produtos específicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Funcionalidade será implementada aqui</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="uso" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usage-limit">Limite de Uso Total</Label>
                  <Input id="usage-limit" type="number" placeholder="100" />
                  <p className="text-xs text-muted-foreground">Número máximo de vezes que o cupom pode ser usado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage-limit-per-user">Limite por Cliente</Label>
                  <Input id="usage-limit-per-user" type="number" placeholder="1" />
                  <p className="text-xs text-muted-foreground">Número máximo de vezes por cliente</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expires-at">Data de Validade</Label>
                  <Input id="expires-at" type="datetime-local" />
                  <p className="text-xs text-muted-foreground">Data e hora de expiração do cupom</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="starts-at">Data de Início</Label>
                  <Input id="starts-at" type="datetime-local" />
                  <p className="text-xs text-muted-foreground">Data e hora de início (opcional)</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button>Salvar Cupom</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

