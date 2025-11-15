import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Category } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle2, FolderOpen } from 'lucide-react'; // Trigger re-evaluation
import {
  Input,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';

export default function AdminCategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await apiRequest<{ items: Category[] }>('/api/categories');
      return response.data?.items || [];
    },
  });

  // Filter categories based on search
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  // Create/Update category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (categoryData: Partial<Category>) => {
      const endpoint = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      return apiRequest<Category>(endpoint, {
        method: editingCategory ? 'PUT' : 'POST',
        body: JSON.stringify(categoryData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // Invalidate storefront categories too
      setIsModalOpen(false);
      setEditingCategory(null);
      setToast({ type: 'success', message: 'Categoria salva com sucesso!' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: Error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao salvar categoria' });
      setTimeout(() => setToast(null), 5000);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setToast({ type: 'success', message: 'Categoria deletada com sucesso!' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: Error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao deletar categoria' });
      setTimeout(() => setToast(null), 5000);
    },
  });

  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta categoria?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Category> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      slug: formData.get('slug') as string,
      parent_id: formData.get('parent_id') ? parseInt(formData.get('parent_id') as string) : null,
      is_active: formData.get('is_active') === 'on' ? 1 : 0,
      meta_title: formData.get('meta_title') as string,
      meta_description: formData.get('meta_description') as string,
    };
    saveCategoryMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground mt-2">Gerencie as categorias dos seus produtos</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar categorias..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Categories Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Carregando categorias...</p>
          </div>
        ) : !filteredCategories || filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhuma categoria encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Categoria Pai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    {category.parent_id
                      ? categories?.find((cat) => cat.id === category.parent_id)?.name || 'N/A'
                      : 'Nenhuma'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        category.is_active === 1
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.is_active === 1 ? 'Ativa' : 'Inativa'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingCategory?.name || ''}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editingCategory?.slug || ''}
                className="col-span-3"
                placeholder="gerado automaticamente se vazio"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description || ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent_id" className="text-right">
                Categoria Pai
              </Label>
              <Select
                name="parent_id"
                defaultValue={editingCategory?.parent_id?.toString() || ''}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {categories?.filter(cat => cat.id !== editingCategory?.id).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativa
              </Label>
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={editingCategory?.is_active === 1}
                className="col-span-3 justify-self-start"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meta_title" className="text-right">
                Meta Título
              </Label>
              <Input
                id="meta_title"
                name="meta_title"
                defaultValue={editingCategory?.meta_title || ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meta_description" className="text-right">
                Meta Descrição
              </Label>
              <Textarea
                id="meta_description"
                name="meta_description"
                defaultValue={editingCategory?.meta_description || ''}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveCategoryMutation.isPending}>
                {saveCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Categoria'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
