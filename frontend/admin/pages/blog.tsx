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
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type BlogPost = {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  status: "draft" | "published" | "scheduled"
  published_at?: string
  created_at: string
}

export default function AdminBlogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data - substituir por chamada real à API
  const { data: postsData, isLoading } = useQuery({
    queryKey: ["admin", "blog", page, search],
    queryFn: async () => {
      return {
        items: [] as BlogPost[],
        total: 0,
        totalPages: 0,
      }
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-title">Título</Label>
              <Input id="post-title" placeholder="Título do post" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-slug">Slug</Label>
              <Input id="post-slug" placeholder="url-amigavel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Resumo</Label>
              <Textarea id="post-excerpt" placeholder="Resumo do post" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">Conteúdo</Label>
              <Textarea id="post-content" placeholder="Conteúdo do post" rows={10} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-status">Status</Label>
              <Select defaultValue="draft">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                </SelectContent>
              </Select>
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

