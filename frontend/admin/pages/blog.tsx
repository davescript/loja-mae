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
import { Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { apiRequest } from "../../utils/api"
import type { BlogPost, ApiResponse } from "@shared/types"


export default function AdminBlogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["admin", "blog", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" })
      if (search) params.set("search", search)
      const res = await apiRequest<{ items: BlogPost[]; total: number; totalPages: number }>(`/api/admin/blog?${params.toString()}`)
      return res.data || { items: [], total: 0, totalPages: 0 }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<BlogPost>) => {
      const res = await apiRequest<BlogPost>("/api/admin/blog", { method: "POST", body: JSON.stringify(payload) })
      if (!res.success) throw new Error(res.error || "Falha ao criar post")
      return res.data as BlogPost
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      toast({ title: "Post criado", description: "Seu post foi publicado/gravado." })
      setIsModalOpen(false)
      setEditingPost(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<BlogPost> }) => {
      const res = await apiRequest<BlogPost>(`/api/admin/blog/${id}`, { method: "PUT", body: JSON.stringify(payload) })
      if (!res.success) throw new Error(res.error || "Falha ao atualizar post")
      return res.data as BlogPost
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      toast({ title: "Post atualizado" })
      setIsModalOpen(false)
      setEditingPost(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/blog/${id}`, { method: "DELETE" })
      if (!res.success) throw new Error(res.error || "Falha ao excluir post")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      toast({ title: "Post removido" })
    },
  })

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      header: "Título",
      sortable: true,
      accessor: (post) => (
        <div>
          <div className="font-medium">{post.title}</div>
          <div className="text-sm text-muted-foreground">{post.slug}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (post) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            post.status === "published"
              ? "bg-green-100 text-green-800"
              : post.status === "scheduled"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {post.status === "published" ? "Publicado" : post.status === "scheduled" ? "Agendado" : "Rascunho"}
        </span>
      ),
    },
    {
      key: "published_at",
      header: "Data de Publicação",
      accessor: (post) =>
        post.published_at
          ? format(new Date(post.published_at), "dd/MM/yyyy", { locale: ptBR })
          : "—",
    },
    {
      key: "created_at",
      header: "Criado em",
      accessor: (post) => format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR }),
    },
    {
      key: "actions",
      header: "Ações",
      accessor: (post) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingPost(post); setIsModalOpen(true) }}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(post.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-2">Gerencie os posts do blog</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Post
        </Button>
      </div>

      <DataTable
        data={postsData?.items || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Pesquisar posts..."
        onSearch={setSearch}
        pagination={
          postsData
            ? {
                page,
                pageSize: 20,
                total: postsData.total,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {/* Blog Post Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Editar Post" : "Novo Post"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Atualize o post do blog" : "Crie um novo post para o blog"}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const title = (document.getElementById("post-title") as HTMLInputElement).value
              const slug = (document.getElementById("post-slug") as HTMLInputElement).value
              const excerpt = (document.getElementById("post-excerpt") as HTMLTextAreaElement).value
              const content = (document.getElementById("post-content") as HTMLTextAreaElement).value
              const status = ((document.getElementById("post-status") as HTMLInputElement)?.value || "draft") as BlogPost['status']
              if (editingPost) {
                updateMutation.mutate({ id: editingPost.id, payload: { title, slug, excerpt, content, status } })
              } else {
                createMutation.mutate({ title, slug, excerpt, content, status, published_at: status === 'published' ? new Date().toISOString() : null })
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="post-title">Título</Label>
              <Input id="post-title" placeholder="Título do post" defaultValue={editingPost?.title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-slug">Slug</Label>
              <Input id="post-slug" placeholder="url-amigavel" defaultValue={editingPost?.slug} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Resumo</Label>
              <Textarea id="post-excerpt" placeholder="Resumo do post" rows={3} defaultValue={editingPost?.excerpt || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">Conteúdo</Label>
              <Textarea id="post-content" placeholder="Conteúdo do post" rows={10} defaultValue={editingPost?.content} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-status">Status</Label>
              <select id="post-status" className="input" defaultValue={editingPost?.status || 'draft'}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="scheduled">Agendado</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>

          
        </DialogContent>
      </Dialog>
    </div>
  )
}
