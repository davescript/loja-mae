import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { AuthUser } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle2, Users as UsersIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '../components/ui';
import { useToast } from '../hooks/useToast';

type AdminUser = AuthUser & {
  created_at: string;
};

export default function AdminUsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [password, setPassword] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch admin users
  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiRequest<{ items: AdminUser[] }>('/api/admin/users');
      return response.data?.items || [];
    },
  });

  // Filter users based on search
  const filteredUsers = adminUsers?.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Create/Update admin user mutation
  const saveUserMutation = useMutation({
    mutationFn: async (userData: Partial<AdminUser> & { password?: string }) => {
      const endpoint = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      return apiRequest<AdminUser>(endpoint, {
        method: editingUser ? 'PUT' : 'POST',
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'Usuário Admin salvo', description: 'O usuário admin foi salvo com sucesso.' });
      setIsModalOpen(false);
      setEditingUser(null);
      setPassword('');
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar usuário admin.', variant: 'destructive' });
    },
  });

  // Delete admin user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'Usuário Admin deletado', description: 'O usuário admin foi deletado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao deletar usuário admin.', variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    setEditingUser(null);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setPassword(''); // Clear password field for security
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este usuário admin?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<AdminUser> & { password?: string } = {
      email: formData.get('email') as string,
      name: formData.get('name') as string || null,
      role: formData.get('role') as AdminUser['role'],
      is_active: formData.get('is_active') === 'on' ? 1 : 0,
    };

    if (password) {
      data.password = password;
    }

    saveUserMutation.mutate(data);
  };

  const getRoleBadge = (role: AuthUser['role']) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let text: string;

    switch (role) {
      case 'super_admin':
        variant = 'destructive';
        text = 'Super Admin';
        break;
      case 'admin':
        variant = 'default';
        text = 'Admin';
        break;
      case 'editor':
        variant = 'outline';
        text = 'Editor';
        break;
      default:
        text = role || 'N/A'; // Fallback for undefined roles
    }
    return <Badge variant={variant}>{text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Admins</h1>
          <p className="text-muted-foreground mt-2">Gerencie os usuários com acesso ao painel administrativo</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Admin
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar admins por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Admin Users Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Carregando usuários admin...</p>
          </div>
        ) : !filteredUsers || filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum usuário admin encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active === 1 ? 'default' : 'secondary'}>
                      {user.is_active === 1 ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('pt-PT')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
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

      {/* Admin User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário Admin' : 'Novo Usuário Admin'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editingUser?.email || ''}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder={editingUser ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
                required={!editingUser}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingUser?.name || ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select
                name="role"
                defaultValue={editingUser?.role || 'editor'}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativo
              </Label>
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={editingUser?.is_active === 1}
                className="col-span-3 justify-self-start h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveUserMutation.isPending}>
                {saveUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Usuário Admin'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
