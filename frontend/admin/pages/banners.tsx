import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DataTable, type Column } from "../components/common/DataTable"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../hooks/useToast"
import { validateImage } from "../../utils/validateImage"
import { Plus, Edit, Trash2, MoreVertical, Image as ImageIcon, Upload, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Banner = {
  id: number
  title: string
  image_url?: string
  link_url?: string
  position: "home_hero" | "home_top" | "home_bottom" | "category" | "product" | "sidebar"
  order: number
  is_active: boolean
  start_date?: string
  end_date?: string
  clicks?: number
  impressions?: number
  created_at: string
}

export default function AdminBannersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data - substituir por chamada real à API
  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["admin", "banners", page, search],
    queryFn: async () => {
      return {
        items: [] as Banner[],
        total: 0,
        totalPages: 0,
      }
    },
  })

  const positionLabels: Record<string, string> = {
    home_hero: "Hero (Home)",
    home_top: "Topo (Home)",
    home_bottom: "Rodapé (Home)",
    category: "Página de Categoria",
    product: "Página de Produto",
    sidebar: "Sidebar",
  }

  const columns: Column<Banner>[] = [
    {
      key: "image",
      header: "Banner",
      accessor: (banner) => (
        <div className="flex items-center gap-3">
          {banner.image_url ? (
            <img src={banner.image_url} alt={banner.title} className="w-20 h-12 object-cover rounded" />
          ) : (
            <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium">{banner.title}</div>
            <div className="text-sm text-muted-foreground">{positionLabels[banner.position] || banner.position}</div>
          </div>
        </div>
      ),
    },
    {
      key: "position",
      header: "Posição",
      accessor: (banner) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {positionLabels[banner.position] || banner.position}
        </span>
      ),
    },
    {
      key: "order",
      header: "Ordem",
      accessor: (banner) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{banner.order}</span>
          <div className="flex flex-col">
            <button className="text-muted-foreground hover:text-foreground">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Período",
      accessor: (banner) => (
        <div className="text-sm">
          {banner.start_date && banner.end_date ? (
            <>
              <div>{format(new Date(banner.start_date), "dd/MM/yyyy", { locale: ptBR })}</div>
              <div className="text-muted-foreground">até {format(new Date(banner.end_date), "dd/MM/yyyy", { locale: ptBR })}</div>
            </>
          ) : (
            <span className="text-muted-foreground">Sem data definida</span>
          )}
        </div>
      ),
    },
    {
      key: "metrics",
      header: "Métricas",
      accessor: (banner) => (
        <div className="text-sm space-y-1">
          {banner.impressions && (
            <div>
              <span className="text-muted-foreground">Impressões: </span>
              <span className="font-medium">{banner.impressions.toLocaleString()}</span>
            </div>
          )}
          {banner.clicks && (
            <div>
              <span className="text-muted-foreground">Cliques: </span>
              <span className="font-medium">{banner.clicks.toLocaleString()}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      accessor: (banner) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            banner.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {banner.is_active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate image
      const { validateImage } = await import("../../utils/validateImage")
      const result = await validateImage(file)
      
      if (!result.valid) {
        toast({
          title: "Erro de validação",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-2">Gerencie os banners da sua loja</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Banners</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannersData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banners Ativos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bannersData?.items?.filter((b) => b.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Impressões</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bannersData?.items?.reduce((sum, b) => sum + (b.impressions || 0), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bannersData?.items?.reduce((sum, b) => sum + (b.clicks || 0), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={bannersData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar banners..."
        onSearch={setSearch}
        pagination={
          bannersData
            ? {
                page,
                pageSize: 20,
                total: bannersData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        actions={(banner) => (
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
                    setEditingBanner(banner)
                    setImagePreview(banner.image_url || null)
                    setIsModalOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
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

      {/* Banner Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
            <DialogDescription>
              {editingBanner ? "Atualize as informações do banner" : "Crie um novo banner para sua loja"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Título *</Label>
              <Input id="banner-title" placeholder="Ex: Promoção de Verão" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-position">Posição</Label>
              <Select defaultValue="home_hero">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_hero">Hero (Home)</SelectItem>
                  <SelectItem value="home_top">Topo (Home)</SelectItem>
                  <SelectItem value="home_bottom">Rodapé (Home)</SelectItem>
                  <SelectItem value="category">Página de Categoria</SelectItem>
                  <SelectItem value="product">Página de Produto</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-image">Imagem do Banner</Label>
              <div className="space-y-4">
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input
                    id="banner-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="banner-image"
                    className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                  >
                    <Upload className="w-4 h-4" />
                    {imagePreview ? "Alterar Imagem" : "Upload de Imagem"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-link">Link (URL)</Label>
              <Input id="banner-link" type="url" placeholder="https://exemplo.com/promocao" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-order">Ordem</Label>
                <Input id="banner-order" type="number" placeholder="1" defaultValue={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-status">Status</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-start-date">Data de Início</Label>
                <Input id="banner-start-date" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-end-date">Data de Término</Label>
                <Input id="banner-end-date" type="datetime-local" />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button>Salvar Banner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
