import { useState } from "react"
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
import { Plus, Edit, Trash2, MoreVertical, Package, Filter, Sparkles } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { motion } from "framer-motion"

type Collection = {
  id: number
  name: string
  slug: string
  description?: string
  type: "manual" | "automatic"
  rules?: CollectionRule[]
  product_count?: number
  is_active: boolean
  created_at: string
}

type CollectionRule = {
  field: "category" | "tag" | "price" | "stock" | "featured"
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in"
  value: string | number
}

export default function AdminCollectionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [collectionType, setCollectionType] = useState<"manual" | "automatic">("manual")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data - substituir por chamada real à API
  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ["admin", "collections", page, search],
    queryFn: async () => {
      return {
        items: [] as Collection[],
        total: 0,
        totalPages: 0,
      }
    },
  })

  const columns: Column<Collection>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      accessor: (collection) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium">{collection.name}</div>
            <div className="text-sm text-muted-foreground">{collection.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      accessor: (collection) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            collection.type === "automatic"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {collection.type === "automatic" ? "Automática" : "Manual"}
        </span>
      ),
    },
    {
      key: "product_count",
      header: "Produtos",
      accessor: (collection) => collection.product_count || 0,
    },
    {
      key: "is_active",
      header: "Status",
      accessor: (collection) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            collection.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {collection.is_active ? "Ativa" : "Inativa"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coleções</h1>
          <p className="text-muted-foreground mt-2">Crie e gerencie coleções de produtos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Coleção
        </Button>
      </div>

      <DataTable
        data={collectionsData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar coleções..."
        onSearch={setSearch}
        pagination={
          collectionsData
            ? {
                page,
                pageSize: 20,
                total: collectionsData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        actions={(collection) => (
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
                    setEditingCollection(collection)
                    setIsModalOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      />

      {/* Collection Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollection ? "Editar Coleção" : "Nova Coleção"}</DialogTitle>
            <DialogDescription>
              {editingCollection
                ? "Atualize as informações da coleção"
                : "Crie uma nova coleção manual ou automática"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="regras">Regras</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">Nome *</Label>
                <Input id="collection-name" placeholder="Ex: Promoções de Verão" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-slug">Slug</Label>
                <Input id="collection-slug" placeholder="promocoes-verao" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-description">Descrição</Label>
                <Textarea id="collection-description" placeholder="Descrição da coleção" rows={4} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-type">Tipo de Coleção</Label>
                <Select value={collectionType} onValueChange={(value) => setCollectionType(value as "manual" | "automatic")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automática (com regras)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {collectionType === "automatic"
                    ? "Produtos serão adicionados automaticamente baseado em regras"
                    : "Você seleciona manualmente os produtos"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="regras" className="space-y-4 mt-4">
              {collectionType === "automatic" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Regras Automáticas
                    </CardTitle>
                    <CardDescription>
                      Defina regras para adicionar produtos automaticamente à coleção
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium">Regra 1</h4>
                            <p className="text-sm text-muted-foreground">Produtos com preço maior que €50</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Campo</Label>
                            <Select defaultValue="price">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="price">Preço</SelectItem>
                                <SelectItem value="category">Categoria</SelectItem>
                                <SelectItem value="tag">Tag</SelectItem>
                                <SelectItem value="stock">Estoque</SelectItem>
                                <SelectItem value="featured">Destaque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Operador</Label>
                            <Select defaultValue="greater_than">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Igual a</SelectItem>
                                <SelectItem value="contains">Contém</SelectItem>
                                <SelectItem value="greater_than">Maior que</SelectItem>
                                <SelectItem value="less_than">Menor que</SelectItem>
                                <SelectItem value="in">Está em</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Valor</Label>
                            <Input type="number" placeholder="50" />
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Regra
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Coleções manuais não usam regras. Selecione os produtos na aba "Produtos".
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="produtos" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produtos da Coleção
                  </CardTitle>
                  <CardDescription>
                    {collectionType === "automatic"
                      ? "Produtos serão adicionados automaticamente baseado nas regras"
                      : "Selecione os produtos para esta coleção"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {collectionType === "manual" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Input placeholder="Buscar produtos..." className="max-w-md" />
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Produtos
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum produto adicionado ainda
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Produtos serão atualizados automaticamente quando as regras forem aplicadas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button>Salvar Coleção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
