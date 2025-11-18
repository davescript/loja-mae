import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "../../utils/api"
import { DataTable, type Column } from "../components/common/DataTable"
import { useToast } from "../hooks/useToast"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Checkbox } from "../components/ui/checkbox"
import { Plus, Edit, Trash2, MoreVertical, Package, Filter, Sparkles, Search, X, Loader2 } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import type { Product, Category } from "@shared/types"
import { formatPrice } from "../../utils/format"

type Collection = {
  id: number
  name: string
  slug: string
  description?: string
  type: "manual" | "automatic"
  rules?: CollectionRule[]
  products?: Product[]
  product_count?: number
  is_active: boolean
  created_at: string
}

type CollectionRule = {
  id?: number
  field: "category" | "tag" | "price" | "stock" | "featured"
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in"
  value: string
}

export default function AdminCollectionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [collectionType, setCollectionType] = useState<"manual" | "automatic">("manual")
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'manual' as 'manual' | 'automatic',
    is_active: true,
  })
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [rules, setRules] = useState<CollectionRule[]>([])
  const [productSearch, setProductSearch] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch collections from API
  const { data: collectionsData, isLoading, error: collectionsError } = useQuery({
    queryKey: ["admin", "collections", page, search],
    queryFn: async () => {
      try {
        const response = await apiRequest<{
          items: Collection[];
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
        }>(`/api/admin/collections?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ''}`);
        return response.data || { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
      } catch (error: any) {
        console.error('Erro ao carregar coleções:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as coleções.',
          variant: 'destructive',
        });
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
      }
    },
  })

  // Fetch products for manual selection
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin", "products", "all", productSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        ...(productSearch && { search: productSearch }),
      });
      const response = await apiRequest<{ items: Product[] }>(`/api/products?${params.toString()}`);
      return response.data?.items || [];
    },
    enabled: isModalOpen && collectionType === 'manual',
  })

  // Fetch categories for rules
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest<{ items: Category[] } | Category[]>("/api/categories");
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.items || [];
    },
  })

  // Load collection data when editing
  useEffect(() => {
    if (editingCollection) {
      setFormData({
        name: editingCollection.name || '',
        slug: editingCollection.slug || '',
        description: editingCollection.description || '',
        type: editingCollection.type || 'manual',
        is_active: editingCollection.is_active ?? true,
      });
      setCollectionType(editingCollection.type || 'manual');
      setRules(editingCollection.rules || []);
      if (editingCollection.products) {
        setSelectedProducts(editingCollection.products.map(p => p.id));
      }
    } else {
      resetForm();
    }
  }, [editingCollection]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'manual',
      is_active: true,
    });
    setCollectionType('manual');
    setSelectedProducts([]);
    setRules([]);
    setProductSearch('');
  }

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Create/Update collection mutation
  const saveCollectionMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      const slug = formData.slug || generateSlug(formData.name);
      const payload: any = {
        name: formData.name,
        slug,
        description: formData.description || undefined,
        type: collectionType,
        is_active: formData.is_active,
      };

      if (collectionType === 'automatic' && rules.length > 0) {
        payload.rules = rules;
      } else if (collectionType === 'manual' && selectedProducts.length > 0) {
        payload.product_ids = selectedProducts;
      }

      const url = editingCollection ? `/api/admin/collections/${editingCollection.id}` : '/api/admin/collections';
      const method = editingCollection ? 'PUT' : 'POST';
      
      return apiRequest(url, {
        method,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: editingCollection ? 'Coleção atualizada' : 'Coleção criada',
        description: 'A coleção foi salva com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      setIsModalOpen(false);
      setEditingCollection(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar coleção.',
        variant: 'destructive',
      });
    },
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/collections/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Coleção deletada',
        description: 'A coleção foi removida com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar coleção.',
        variant: 'destructive',
      });
    },
  });

  // Add rule
  const addRule = () => {
    setRules([...rules, { field: 'category', operator: 'equals', value: '' }]);
  };

  // Remove rule
  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  // Update rule
  const updateRule = (index: number, field: keyof CollectionRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  // Toggle product selection
  const toggleProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

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

  const filteredProducts = productsData?.filter(product => 
    product.title.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coleções</h1>
          <p className="text-muted-foreground mt-2">Crie e gerencie coleções de produtos</p>
        </div>
        <Button onClick={() => {
          setEditingCollection(null);
          resetForm();
          setIsModalOpen(true);
        }}>
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
                    setEditingCollection(collection);
                    setIsModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2 text-red-600"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar esta coleção?')) {
                      deleteCollectionMutation.mutate(collection.id);
                    }
                  }}
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
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setEditingCollection(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollection ? "Editar Coleção" : "Nova Coleção"}</DialogTitle>
            <DialogDescription>
              {editingCollection
                ? "Atualize as informações da coleção"
                : "Crie uma nova coleção manual ou automática"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            saveCollectionMutation.mutate();
          }}>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="regras" disabled={collectionType === 'manual'}>Regras</TabsTrigger>
                <TabsTrigger value="produtos" disabled={collectionType === 'automatic'}>Produtos</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="collection-name">Nome *</Label>
                  <Input 
                    id="collection-name" 
                    placeholder="Ex: Promoções de Verão"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!formData.slug || formData.slug === generateSlug(formData.name)) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection-slug">Slug</Label>
                  <Input 
                    id="collection-slug" 
                    placeholder="promocoes-verao"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL amigável. Se deixado vazio, será gerado automaticamente do nome.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection-description">Descrição</Label>
                  <Textarea 
                    id="collection-description" 
                    placeholder="Descrição da coleção" 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection-type">Tipo de Coleção</Label>
                  <Select 
                    value={collectionType} 
                    onValueChange={(value) => {
                      setCollectionType(value as "manual" | "automatic");
                      setFormData({ ...formData, type: value as "manual" | "automatic" });
                      if (value === 'automatic') {
                        setSelectedProducts([]);
                      } else {
                        setRules([]);
                      }
                    }}
                  >
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Coleção ativa
                  </Label>
                </div>
              </TabsContent>

              <TabsContent value="regras" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Filter className="w-5 h-5" />
                          Regras Automáticas
                        </CardTitle>
                        <CardDescription>
                          Defina regras para adicionar produtos automaticamente à coleção
                        </CardDescription>
                      </div>
                      <Button type="button" variant="outline" onClick={addRule}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Regra
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma regra definida. Adicione uma regra para começar.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rules.map((rule, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium">Regra {index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRule(index)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Campo</Label>
                                  <Select
                                    value={rule.field}
                                    onValueChange={(value) => updateRule(index, 'field', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="category">Categoria</SelectItem>
                                      <SelectItem value="price">Preço</SelectItem>
                                      <SelectItem value="stock">Estoque</SelectItem>
                                      <SelectItem value="featured">Destaque</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Operador</Label>
                                  <Select
                                    value={rule.operator}
                                    onValueChange={(value) => updateRule(index, 'operator', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {rule.field === 'category' && (
                                        <>
                                          <SelectItem value="equals">Igual a</SelectItem>
                                          <SelectItem value="in">Está em</SelectItem>
                                        </>
                                      )}
                                      {rule.field === 'price' && (
                                        <>
                                          <SelectItem value="greater_than">Maior que</SelectItem>
                                          <SelectItem value="less_than">Menor que</SelectItem>
                                        </>
                                      )}
                                      {rule.field === 'stock' && (
                                        <>
                                          <SelectItem value="greater_than">Maior que</SelectItem>
                                          <SelectItem value="less_than">Menor que</SelectItem>
                                        </>
                                      )}
                                      {rule.field === 'featured' && (
                                        <SelectItem value="equals">Igual a</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Valor</Label>
                                  {rule.field === 'category' ? (
                                    <Select
                                      value={rule.value}
                                      onValueChange={(value) => updateRule(index, 'value', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione categoria" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories?.map(cat => (
                                          <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : rule.field === 'featured' ? (
                                    <Select
                                      value={rule.value}
                                      onValueChange={(value) => updateRule(index, 'value', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true">Sim</SelectItem>
                                        <SelectItem value="false">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      type={rule.field === 'price' ? 'number' : 'number'}
                                      step={rule.field === 'price' ? '0.01' : '1'}
                                      placeholder={rule.field === 'price' ? '0.00' : '0'}
                                      value={rule.value}
                                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                                    />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="produtos" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Produtos da Coleção
                    </CardTitle>
                    <CardDescription>
                      Selecione os produtos para esta coleção manual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar produtos..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Badge variant="secondary">
                          {selectedProducts.length} selecionado{selectedProducts.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {productsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum produto encontrado</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                          <div className="divide-y">
                            {filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                                onClick={() => toggleProduct(product.id)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    checked={selectedProducts.includes(product.id)}
                                    onCheckedChange={() => toggleProduct(product.id)}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{product.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatPrice(product.price_cents)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCollection(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saveCollectionMutation.isPending || !formData.name.trim()}
              >
                {saveCollectionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Coleção'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
