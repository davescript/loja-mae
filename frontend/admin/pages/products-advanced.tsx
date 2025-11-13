import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest, apiFormData } from "../../utils/api"
import type { Product, Category } from "@shared/types"
import { DataTable, type Column } from "../components/common/DataTable"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../hooks/useToast"
import { formatPrice } from "../../utils/format"
import { Plus, Edit, Trash2, MoreVertical, Eye } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useForm } from "react-hook-form"

type ProductFormData = {
  title: string
  description?: string
  short_description?: string
  price_cents: number
  compare_at_price_cents?: number | null
  sku?: string | null
  stock_quantity: number
  status: "draft" | "active" | "archived"
  category_id?: number | null
}

export default function AdminProductsPageAdvanced() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin", "products", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        include: "images",
        ...(search && { search }),
      })
      const response = await apiRequest<{ items: Product[]; total: number; totalPages: number }>(
        `/api/products?${params.toString()}`
      )
      return response.data || { items: [], total: 0, totalPages: 0 }
    },
  })

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest<Category[]>("/api/categories")
      return response.data || []
    },
  })

  const form = useForm<ProductFormData>({
    defaultValues: {
      title: "",
      description: "",
      short_description: "",
      price_cents: 0,
      compare_at_price_cents: null,
      sku: "",
      stock_quantity: 0,
      status: "draft",
      category_id: null,
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString())
        }
      })
      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      return apiFormData<Product>(endpoint, formData, {
        method: editingProduct ? "PUT" : "POST",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
      toast({
        title: "Sucesso",
        description: `Produto ${editingProduct ? "atualizado" : "criado"} com sucesso!`,
      })
      setIsModalOpen(false)
      setEditingProduct(null)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/products/${id}`, { method: "DELETE" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
      toast({
        title: "Sucesso",
        description: "Produto deletado com sucesso!",
      })
    },
  })

  const columns: Column<Product>[] = [
    {
      key: "image",
      header: "Imagem",
      accessor: (product) => (
        <img
          src={product.images?.[0]?.image_url || "/placeholder.png"}
          alt={product.title}
          className="w-12 h-12 object-cover rounded"
        />
      ),
    },
    {
      key: "title",
      header: "Nome",
      sortable: true,
      accessor: (product) => (
        <div>
          <div className="font-medium">{product.title}</div>
          {product.sku && <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>}
        </div>
      ),
    },
    {
      key: "price_cents",
      header: "Preço",
      sortable: true,
      accessor: (product) => (
        <div>
          <div className="font-medium">{formatPrice(product.price_cents)}</div>
          {product.compare_at_price_cents && (
            <div className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price_cents)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "stock_quantity",
      header: "Estoque",
      sortable: true,
      accessor: (product) => product.stock_quantity,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (product) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            product.status === "active"
              ? "bg-green-100 text-green-800"
              : product.status === "draft"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {product.status === "active" ? "Ativo" : product.status === "draft" ? "Rascunho" : "Arquivado"}
        </span>
      ),
    },
  ]

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.reset({
      title: product.title,
      description: product.description || "",
      short_description: product.short_description || "",
      price_cents: product.price_cents / 100,
      compare_at_price_cents: product.compare_at_price_cents ? product.compare_at_price_cents / 100 : null,
      sku: product.sku || "",
      stock_quantity: product.stock_quantity,
      status: product.status as "draft" | "active" | "archived",
      category_id: product.category_id,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      deleteMutation.mutate(id)
    }
  }

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate({
      ...data,
      price_cents: Math.round(data.price_cents * 100),
      compare_at_price_cents: data.compare_at_price_cents ? Math.round(data.compare_at_price_cents * 100) : null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus produtos e inventário</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <DataTable
        data={productsData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar produtos..."
        onSearch={setSearch}
        pagination={
          productsData
            ? {
                page,
                pageSize: 20,
                total: productsData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        selection={{
          selected: selectedProducts,
          onSelect: setSelectedProducts,
          getId: (product) => product.id.toString(),
        }}
        actions={(product) => (
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
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2 text-red-600"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      />

      {/* Product Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Atualize as informações do produto" : "Adicione um novo produto ao catálogo"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="preco">Preço & Estoque</TabsTrigger>
                <TabsTrigger value="imagens">Imagens</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={form.watch("title")}
                    onChange={(e) => form.setValue("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Descrição Curta</Label>
                  <Textarea
                    id="short_description"
                    value={form.watch("short_description") || ""}
                    onChange={(e) => form.setValue("short_description", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Completa</Label>
                  <Textarea
                    id="description"
                    value={form.watch("description") || ""}
                    onChange={(e) => form.setValue("description", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Categoria</Label>
                    <Select
                      value={form.watch("category_id")?.toString() || ""}
                      onValueChange={(value) => form.setValue("category_id", value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={form.watch("sku") || ""}
                      onChange={(e) => form.setValue("sku", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as "draft" | "active" | "archived")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="preco" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_cents">Preço (€) *</Label>
                    <Input
                      id="price_cents"
                      type="number"
                      step="0.01"
                      value={form.watch("price_cents") || 0}
                      onChange={(e) => form.setValue("price_cents", parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compare_at_price_cents">Preço de Comparação (€)</Label>
                    <Input
                      id="compare_at_price_cents"
                      type="number"
                      step="0.01"
                      value={form.watch("compare_at_price_cents") || ""}
                      onChange={(e) =>
                        form.setValue("compare_at_price_cents", e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={form.watch("stock_quantity") || 0}
                    onChange={(e) => form.setValue("stock_quantity", parseInt(e.target.value) || 0)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="imagens" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Upload de imagens será implementado aqui</p>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Campos SEO serão implementados aqui</p>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

