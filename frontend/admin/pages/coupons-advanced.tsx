import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "../../utils/api"
import { DataTable, type Column } from "../components/common/DataTable"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../hooks/useToast"
import { Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cupons</h1>
          <p className="text-muted-foreground mt-2">Gerencie cupons de desconto</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
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
      />

      {/* Coupon Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? "Atualize o cupom de desconto" : "Crie um novo cupom de desconto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Código</Label>
              <Input id="coupon-code" placeholder="DESCONTO10" className="font-mono" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount-type">Tipo de Desconto</Label>
                <Select defaultValue="percentage">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-value">Valor</Label>
                <Input id="discount-value" type="number" placeholder="10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum-amount">Valor Mínimo (€)</Label>
              <Input id="minimum-amount" type="number" placeholder="50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-at">Data de Validade</Label>
              <Input id="expires-at" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage-limit">Limite de Uso</Label>
              <Input id="usage-limit" type="number" placeholder="100" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

