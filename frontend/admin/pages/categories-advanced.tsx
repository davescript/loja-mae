import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, FolderTree, Image as ImageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Category } from "@shared/types"

type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[]
  product_count?: number
}

export default function AdminCategoriesPageAdvanced() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["admin", "categories", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "100",
        ...(search && { search }),
      })
      const response = await apiRequest<{ items: Category[] } | Category[]>(`/api/categories?${params.toString()}`)
      // API pode retornar { items: [] } ou [] diretamente
      if (Array.isArray(response.data)) {
        return response.data
      }
      return response.data?.items || []
    },
  })

  const buildCategoryTree = (categories: Category[]): CategoryWithChildren[] => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return []
    }

    const categoryMap = new Map<number, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // Create map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Build tree structure
    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!
        if (!parent.children) parent.children = []
        parent.children.push(category)
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const categoryTree = Array.isArray(categoriesData) && categoriesData.length > 0 
    ? buildCategoryTree(categoriesData) 
    : []

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const endpoint = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"
      return apiRequest<Category>(endpoint, {
        method: editingCategory ? "PUT" : "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      // Invalidate storefront queries (all variations)
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories", "active"] })
      queryClient.invalidateQueries({ queryKey: ["categories", "collections"] })
      toast({
        title: "Sucesso",
        description: `Categoria ${editingCategory ? "atualizada" : "criada"} com sucesso!`,
      })
      setIsModalOpen(false)
      setEditingCategory(null)
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/categories/${id}`, { method: "DELETE" })
    },
    onSuccess: () => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      // Invalidate storefront queries (all variations)
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories", "active"] })
      queryClient.invalidateQueries({ queryKey: ["categories", "collections"] })
      toast({
        title: "Sucesso",
        description: "Categoria deletada com sucesso!",
      })
    },
  })

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryTree = (categories: CategoryWithChildren[], level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0
      const isExpanded = expandedCategories.has(category.id)

      return (
        <div key={category.id} className="select-none">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
              level > 0 ? "ml-6" : ""
            }`}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <FolderTree className="w-4 h-4 text-muted-foreground" />

            <div className="flex-1">
              <div className="font-medium">{category.name}</div>
              {category.description && (
                <div className="text-sm text-muted-foreground truncate">{category.description}</div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {category.product_count || 0} produtos
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingCategory(category)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Tem certeza que deseja deletar esta categoria?")) {
                    deleteMutation.mutate(category.id)
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderCategoryTree(category.children!, level + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    })
  }

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      accessor: (category) => (
        <div>
          <div className="font-medium">{category.name}</div>
          {category.slug && (
            <div className="text-sm text-muted-foreground">/{category.slug}</div>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "Descrição",
      accessor: (category) => (
        <div className="text-sm text-muted-foreground truncate max-w-md">
          {category.description || "—"}
        </div>
      ),
    },
    {
      key: "parent_id",
      header: "Categoria Pai",
      accessor: (category) => {
        if (!category.parent_id) return "—"
        const parent = Array.isArray(categoriesData) 
          ? categoriesData.find((c) => c.id === category.parent_id)
          : null
        return parent?.name || "—"
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (category) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            category.is_active === 1
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {category.is_active === 1 ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground mt-2">Gerencie categorias hierárquicas do catálogo</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-md">
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
            >
              Árvore
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Tabela
            </Button>
          </div>
          <Button onClick={() => {
            setEditingCategory(null)
            setIsModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {viewMode === "tree" ? (
        <Card>
          <CardHeader>
            <CardTitle>Estrutura de Categorias</CardTitle>
            <CardDescription>Visualize e gerencie a hierarquia de categorias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : categoryTree.length > 0 ? (
              <div className="space-y-1">{renderCategoryTree(categoryTree)}</div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma categoria encontrada
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={Array.isArray(categoriesData) ? categoriesData : []}
          columns={columns}
          loading={isLoading}
          searchable
          searchPlaceholder="Pesquisar categorias..."
          onSearch={setSearch}
        />
      )}

      {/* Category Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Atualize as informações da categoria" : "Crie uma nova categoria"}
            </DialogDescription>
          </DialogHeader>

          <CategoryForm
            category={editingCategory}
            categories={categoriesData || []}
            onSave={(data) => {
              saveMutation.mutate(data)
            }}
            onCancel={() => {
              setIsModalOpen(false)
              setEditingCategory(null)
            }}
            isLoading={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryForm({
  category,
  categories,
  onSave,
  onCancel,
  isLoading,
}: {
  category: Category | null
  categories: Category[]
  onSave: (data: Partial<Category>) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [name, setName] = useState(category?.name || "")
  const [slug, setSlug] = useState(category?.slug || "")
  const [description, setDescription] = useState(category?.description || "")
  const [parentId, setParentId] = useState<number | null>(category?.parent_id || null)
  const [isActive, setIsActive] = useState<number>(
    category?.is_active ?? 1
  )

  // Update form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name || "")
      setSlug(category.slug || "")
      setDescription(category.description || "")
      setParentId(category.parent_id || null)
      setIsActive(category.is_active ?? 1)
    } else {
      setName("")
      setSlug("")
      setDescription("")
      setParentId(null)
      setIsActive(1)
    }
  }, [category?.id]) // Use category.id to trigger update when category changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
      onSave({
        name,
        slug: slug || undefined,
        description: description || undefined,
        parent_id: parentId || undefined,
        is_active: isActive,
      })
  }

  // Filter out current category and its children from parent options
  const availableParents = Array.isArray(categories) 
    ? categories.filter(
        (c) => c.id !== category?.id && c.parent_id !== category?.id
      )
    : []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome da categoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-amigavel (gerado automaticamente se vazio)"
            />
            <p className="text-xs text-muted-foreground">
              Deixe vazio para gerar automaticamente a partir do nome
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrição da categoria"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_id">Categoria Pai</Label>
              <Select
                value={parentId?.toString() || "none"}
                onValueChange={(value) => setParentId(value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (categoria raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (categoria raiz)</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={isActive === 1 ? "active" : "inactive"} onValueChange={(value) => setIsActive(value === "active" ? 1 : 0)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Título SEO</Label>
            <Input id="meta_title" placeholder="Título para SEO" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Descrição SEO</Label>
            <Textarea id="meta_description" rows={3} placeholder="Descrição para SEO" />
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  )
}

