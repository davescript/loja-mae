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
import { handleError } from "../../utils/errorHandler"
import { formatPrice } from "../../utils/format"
import { validateImage } from "../../utils/validateImage"
import { Plus, Edit, Trash2, MoreVertical, Eye, X } from "lucide-react"
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
  featured?: boolean
  category_id?: number | null
  meta_title?: string | null
  meta_description?: string | null
}

export default function AdminProductsPageAdvanced() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState<File[]>([])
  const [imageErrors, setImageErrors] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: productsData, isLoading, error: productsError } = useQuery({
    queryKey: ["admin", "products", page, search],
    queryFn: async () => {
      try {
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
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos",
          variant: "destructive",
        })
        return { items: [], total: 0, totalPages: 0 }
      }
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
      featured: false,
      category_id: null,
      meta_title: "",
      meta_description: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      return apiFormData<Product>(endpoint, formData, {
        method: editingProduct ? "PUT" : "POST",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
      toast({
        title: "Sucesso",
        description: `Produto ${editingProduct ? "atualizado" : "criado"} com sucesso!`,
      })
      setIsModalOpen(false)
      setEditingProduct(null)
      setUploadingImages([])
      setImageErrors([])
      setImagesToDelete([])
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
          src={product.images && product.images.length > 0 ? product.images[0].image_url : "/placeholder.png"}
          alt={product.title || "Produto"}
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.png"
          }}
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
    try {
      setEditingProduct(product)
      setImagesToDelete([])
      form.reset({
        title: product.title || "",
        description: product.description || "",
        short_description: product.short_description || "",
        price_cents: product.price_cents ? product.price_cents / 100 : 0,
        compare_at_price_cents: product.compare_at_price_cents ? product.compare_at_price_cents / 100 : null,
        sku: product.sku || "",
        stock_quantity: product.stock_quantity || 0,
        status: (product.status || "draft") as "draft" | "active" | "archived",
        featured: product.featured === 1,
        category_id: product.category_id || null,
        meta_title: (product as any).meta_title || "",
        meta_description: (product as any).meta_description || "",
      })
      setUploadingImages([])
      setImageErrors([])
      setIsModalOpen(true)
    } catch (error) {
      console.error('Erro ao editar produto:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto",
        variant: "destructive",
      })
    }
  }

  const handleNew = () => {
    setEditingProduct(null)
    setImagesToDelete([])
    form.reset({
      title: "",
      description: "",
      short_description: "",
      price_cents: 0,
      compare_at_price_cents: null,
      sku: "",
      stock_quantity: 0,
      status: "draft",
      featured: false,
      category_id: null,
      meta_title: "",
      meta_description: "",
    })
    setUploadingImages([])
    setImageErrors([])
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const errors: string[] = []
    const validFiles: File[] = []

    for (const file of files) {
      const result = await validateImage(file)
      if (result.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${result.error}`)
      }
    }

    if (errors.length > 0) {
      setImageErrors(errors)
      toast({
        title: "Erro de validação",
        description: errors.join(", "),
        variant: "destructive",
      })
    } else {
      setImageErrors([])
    }

    setUploadingImages([...uploadingImages, ...validFiles])
  }

  const removeImage = (index: number) => {
    setUploadingImages(uploadingImages.filter((_, i) => i !== index))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const isValid = await form.trigger()
    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      })
      return
    }

    const data = form.getValues()
    
    // Validate images
    if (uploadingImages.length > 0) {
      for (const file of uploadingImages) {
        const result = await validateImage(file)
        if (!result.valid) {
          toast({
            title: "Erro de validação",
            description: `${file.name}: ${result.error}`,
            variant: "destructive",
          })
          return
        }
      }
    }

    // Create FormData
    const formData = new FormData()
    formData.append("title", data.title || "")
    if (data.description) formData.append("description", data.description)
    if (data.short_description) formData.append("short_description", data.short_description)
    formData.append("price_cents", Math.round((data.price_cents || 0) * 100).toString())
    if (data.compare_at_price_cents) {
      formData.append("compare_at_price_cents", Math.round(data.compare_at_price_cents * 100).toString())
    }
    if (data.sku) formData.append("sku", data.sku)
    formData.append("stock_quantity", (data.stock_quantity || 0).toString())
    formData.append("status", data.status || "draft")
    if (data.category_id) formData.append("category_id", data.category_id.toString())
    if (data.featured !== undefined) formData.append("featured", data.featured ? "1" : "0")
    if (data.meta_title) formData.append("meta_title", data.meta_title)
    if (data.meta_description) formData.append("meta_description", data.meta_description)

    // Add images
    uploadingImages.forEach((file: File) => {
      formData.append("images", file)
    })
    
    // Add images to delete (for editing)
    if (editingProduct && imagesToDelete.length > 0) {
      formData.append("images_to_delete", JSON.stringify(imagesToDelete))
    }

    saveMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus produtos e inventário</p>
        </div>
        <Button onClick={handleNew}>
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

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="featured">Destaque</Label>
                    <Select
                      value={form.watch("featured") ? "1" : "0"}
                      onValueChange={(value) => form.setValue("featured", value === "1")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Não</SelectItem>
                        <SelectItem value="1">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    {...form.register("stock_quantity", { valueAsNumber: true })}
                  />
                  {form.formState.errors.stock_quantity && (
                    <p className="text-sm text-red-600">{form.formState.errors.stock_quantity.message}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="imagens" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {/* Existing Images (when editing) */}
                  {editingProduct && editingProduct.images && Array.isArray(editingProduct.images) && editingProduct.images.length > 0 && (
                    <div>
                      <Label>Imagens Existentes</Label>
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        {editingProduct.images.map((img) => {
                          if (!img || !img.id) return null
                          return (
                            <div key={img.id} className="relative">
                              <img
                                src={img.image_url || "/placeholder.png"}
                                alt={img.alt_text || `Imagem ${img.id}`}
                                className="w-full h-32 object-cover rounded-lg border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.png"
                                }}
                              />
                              {imagesToDelete.includes(img.id) ? (
                                <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-semibold">Remover</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setImagesToDelete([...imagesToDelete, img.id])}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="images">Adicionar Novas Imagens</Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleImageChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, WebP, GIF. Máximo 5MB por imagem.
                    </p>
                  </div>

                  {imageErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800">Erros de validação:</p>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {imageErrors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {uploadingImages.length > 0 && (
                    <div>
                      <Label>Novas Imagens (Preview)</Label>
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        {uploadingImages.map((file: File, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <p className="mt-1 text-xs text-muted-foreground truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Título (SEO)</Label>
                    <Input
                      id="meta_title"
                      value={form.watch("meta_title") || ""}
                      onChange={(e) => form.setValue("meta_title", e.target.value)}
                      placeholder="Título para SEO (aparece nos resultados de busca)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 50-60 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Descrição (SEO)</Label>
                    <Textarea
                      id="meta_description"
                      value={form.watch("meta_description") || ""}
                      onChange={(e) => form.setValue("meta_description", e.target.value)}
                      rows={3}
                      placeholder="Descrição para SEO (aparece nos resultados de busca)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 150-160 caracteres
                    </p>
                  </div>
                </div>
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

