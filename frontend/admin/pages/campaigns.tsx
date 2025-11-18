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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useToast } from "../hooks/useToast"
import { apiRequest } from "../../utils/api"
import { Plus, Edit, Trash2, MoreVertical, Megaphone, Calendar, Target, TrendingUp } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Campaign = {
  id: number
  name: string
  description?: string
  type: "discount" | "banner" | "email" | "social"
  status: "draft" | "scheduled" | "active" | "paused" | "completed"
  start_date?: string
  end_date?: string
  budget?: number
  spent?: number
  impressions?: number
  clicks?: number
  conversions?: number
  content?: string
  created_at: string
}

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount' as 'discount' | 'banner' | 'email' | 'social',
    status: 'draft' as 'draft' | 'scheduled' | 'active' | 'paused' | 'completed',
    start_date: '',
    end_date: '',
    budget: '',
    content: '',
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch campaigns from API
  const { data: campaignsData, isLoading, error: campaignsError } = useQuery({
    queryKey: ["admin", "campaigns", page, search],
    queryFn: async () => {
      try {
        const response = await apiRequest<{
          items: Campaign[];
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
        }>(`/api/admin/campaigns?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ''}`);
        return response.data || { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
      } catch (error: any) {
        console.error('Erro ao carregar campanhas:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as campanhas.',
          variant: 'destructive',
        });
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
      }
    },
  })

  // Create/Update campaign mutation
  const saveCampaignMutation = useMutation({
    mutationFn: async (data: Partial<Campaign> & { id?: number }) => {
      const url = data.id ? `/api/admin/campaigns/${data.id}` : '/api/admin/campaigns';
      const method = data.id ? 'PUT' : 'POST';
      const { id, ...payload } = data;
      return apiRequest(url, {
        method,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: editingCampaign ? 'Campanha atualizada' : 'Campanha criada',
        description: 'A campanha foi salva com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setIsModalOpen(false);
      setEditingCampaign(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar campanha.',
        variant: 'destructive',
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Campanha deletada',
        description: 'A campanha foi removida com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar campanha.',
        variant: 'destructive',
      });
    },
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "Rascunho", color: "bg-gray-100 text-gray-800" },
    scheduled: { label: "Agendada", color: "bg-blue-100 text-blue-800" },
    active: { label: "Ativa", color: "bg-green-100 text-green-800" },
    paused: { label: "Pausada", color: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Concluída", color: "bg-purple-100 text-purple-800" },
  }

  const typeConfig: Record<string, { label: string; icon: any }> = {
    discount: { label: "Desconto", icon: TrendingUp },
    banner: { label: "Banner", icon: Megaphone },
    email: { label: "E-mail", icon: Target },
    social: { label: "Social", icon: Megaphone },
  }

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campanha",
      sortable: true,
      accessor: (campaign) => {
        const TypeIcon = typeConfig[campaign.type]?.icon || Megaphone
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">{campaign.name}</div>
              <div className="text-sm text-muted-foreground">{typeConfig[campaign.type]?.label || campaign.type}</div>
            </div>
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (campaign) => {
        const config = statusConfig[campaign.status] || statusConfig.draft
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>{config.label}</span>
        )
      },
    },
    {
      key: "dates",
      header: "Período",
      accessor: (campaign) => (
        <div className="text-sm">
          {campaign.start_date && campaign.end_date ? (
            <>
              <div>{format(new Date(campaign.start_date), "dd/MM/yyyy", { locale: ptBR })}</div>
              <div className="text-muted-foreground">até {format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: ptBR })}</div>
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
      accessor: (campaign) => (
        <div className="text-sm space-y-1">
          {campaign.impressions && (
            <div>
              <span className="text-muted-foreground">Impressões: </span>
              <span className="font-medium">{campaign.impressions.toLocaleString()}</span>
            </div>
          )}
          {campaign.clicks && (
            <div>
              <span className="text-muted-foreground">Cliques: </span>
              <span className="font-medium">{campaign.clicks.toLocaleString()}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "budget",
      header: "Orçamento",
      accessor: (campaign) => (
        <div className="text-sm">
          {campaign.budget ? (
            <>
              <div className="font-medium">€{campaign.budget.toLocaleString()}</div>
              {campaign.spent && (
                <div className="text-muted-foreground">Gasto: €{campaign.spent.toLocaleString()}</div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas campanhas de marketing</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignsData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignsData?.items?.filter((c) => c.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €
              {campaignsData?.items
                ?.reduce((sum, c) => sum + (c.spent || 0), 0)
                .toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignsData?.items?.reduce((sum, c) => sum + (c.clicks || 0), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={campaignsData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar campanhas..."
        onSearch={setSearch}
        pagination={
          campaignsData
            ? {
                page,
                pageSize: 20,
                total: campaignsData.total,
                onPageChange: setPage,
              }
            : undefined
        }
        actions={(campaign) => (
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
                    setEditingCampaign(campaign)
                    setIsModalOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  className="px-3 py-2 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2 text-red-600"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar esta campanha?')) {
                      deleteCampaignMutation.mutate(campaign.id);
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

      {/* Campaign Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setEditingCampaign(null);
          setFormData({
            name: '',
            description: '',
            type: 'discount',
            status: 'draft',
            start_date: '',
            end_date: '',
            budget: '',
            content: '',
          });
        } else if (editingCampaign) {
          setFormData({
            name: editingCampaign.name || '',
            description: editingCampaign.description || '',
            type: editingCampaign.type || 'discount',
            status: editingCampaign.status || 'draft',
            start_date: editingCampaign.start_date ? new Date(editingCampaign.start_date).toISOString().slice(0, 16) : '',
            end_date: editingCampaign.end_date ? new Date(editingCampaign.end_date).toISOString().slice(0, 16) : '',
            budget: editingCampaign.budget?.toString() || '',
            content: editingCampaign.content || '',
          });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Atualize as informações da campanha" : "Crie uma nova campanha de marketing"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!formData.name.trim()) {
              toast({
                title: 'Erro',
                description: 'Nome da campanha é obrigatório.',
                variant: 'destructive',
              });
              return;
            }
            const payload: any = {
              ...formData,
              budget: formData.budget ? parseFloat(formData.budget) : undefined,
              start_date: formData.start_date || undefined,
              end_date: formData.end_date || undefined,
            };
            if (editingCampaign) payload.id = editingCampaign.id;
            saveCampaignMutation.mutate(payload);
          }}>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="periodo">Período</TabsTrigger>
                <TabsTrigger value="orçamento">Orçamento</TabsTrigger>
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Nome da Campanha *</Label>
                  <Input 
                    id="campaign-name" 
                    placeholder="Ex: Promoção de Verão 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-type">Tipo de Campanha</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Desconto</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-description">Descrição</Label>
                  <Textarea 
                    id="campaign-description" 
                    placeholder="Descrição da campanha" 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-status">Status</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="periodo" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Data de Início</Label>
                    <Input 
                      id="start-date" 
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Data de Término</Label>
                    <Input 
                      id="end-date" 
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orçamento" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-budget">Orçamento (€)</Label>
                  <Input 
                    id="campaign-budget" 
                    type="number" 
                    placeholder="1000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Defina um orçamento máximo para esta campanha. O sistema irá pausar automaticamente quando o limite for atingido.
                </p>
              </TabsContent>

              <TabsContent value="conteudo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-content">Conteúdo da Campanha</Label>
                  <Textarea 
                    id="campaign-content" 
                    placeholder="Conteúdo da campanha..." 
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveCampaignMutation.isPending}>
                {saveCampaignMutation.isPending ? 'Salvando...' : 'Salvar Campanha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
