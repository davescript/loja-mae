import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import { Address } from '../../../../shared/types';
import { useToast } from '../../../admin/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../../admin/components/ui/card';
import { Button } from '../../../admin/components/ui/button';
import { Input } from '../../../admin/components/ui/input';
import { Label } from '../../../admin/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../admin/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, Check } from 'lucide-react';
import { Badge } from '../../../admin/components/ui/badge';

export default function CustomerAddressesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [formData, setFormData] = useState({
    type: 'shipping' as 'shipping' | 'billing' | 'both',
    first_name: '',
    last_name: '',
    company: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'PT',
    phone: '',
    is_default: false,
  });

  // Fetch addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const response = await apiRequest<Address[]>('/api/customers/addresses');
      return response.data || [];
    },
  });

  // Create/Update address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: number }) => {
      // Verificar se há token antes de fazer a requisição
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Você precisa estar autenticado para salvar endereços. Por favor, faça login novamente.');
      }

      console.log('Salvando endereço com token:', token.substring(0, 20) + '...');

      const url = editingAddress 
        ? `/api/customers/addresses/${editingAddress.id}`
        : '/api/customers/addresses';
      
      try {
        const response = await apiRequest(url, {
          method: editingAddress ? 'PUT' : 'POST',
          body: JSON.stringify(data),
        });
        console.log('Endereço salvo com sucesso:', response);
        return response;
      } catch (error: any) {
        console.error('Erro na requisição de salvar endereço:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingAddress ? 'Endereço atualizado' : 'Endereço adicionado',
        description: 'O endereço foi salvo com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Erro ao salvar endereço:', error);
      
      // Se for erro de autenticação, redirecionar para login
      const errorMessage = error?.message || error?.error || '';
      if (
        errorMessage.includes('Authentication') || 
        errorMessage.includes('autenticado') || 
        errorMessage.includes('401') ||
        errorMessage.includes('Invalid or expired token') ||
        errorMessage.includes('Token inválido')
      ) {
        toast({
          title: 'Sessão expirada',
          description: 'Sua sessão expirou. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        // Limpar tokens e redirecionar após um breve delay
        setTimeout(() => {
          localStorage.removeItem('customer_token');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 1500);
        return;
      }

      toast({
        title: 'Erro',
        description: errorMessage || 'Erro ao salvar endereço.',
        variant: 'destructive',
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/customers/addresses/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Endereço removido',
        description: 'O endereço foi removido com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover endereço.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'shipping',
      first_name: '',
      last_name: '',
      company: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'PT',
      phone: '',
      is_default: false,
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default === 1,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAddressMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus Endereços</h1>
          <p className="text-muted-foreground">
            Gerencie seus endereços de entrega e faturação.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nome *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Sobrenome *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address_line1">Endereço *</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_line1: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address_line2">Complemento</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Distrito *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Código Postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, postal_code: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">País *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_default">Marcar como endereço principal</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveAddressMutation.isPending}>
                  {saveAddressMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : addresses && addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address: Address) => (
            <Card key={address.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    {address.type === 'shipping' ? 'Entrega' : address.type === 'billing' ? 'Faturação' : 'Ambos'}
                  </CardTitle>
                  {address.is_default === 1 && (
                    <Badge variant="default">
                      <Check className="w-3 h-3 mr-1" />
                      Principal
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {address.first_name} {address.last_name}
                  </p>
                  {address.company && <p>{address.company}</p>}
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>
                    {address.postal_code} {address.city}
                  </p>
                  {address.state && <p>{address.state}</p>}
                  <p>{address.country}</p>
                  {address.phone && <p className="mt-2">{address.phone}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja remover este endereço?')) {
                        deleteAddressMutation.mutate(address.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione um endereço para facilitar suas compras.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

