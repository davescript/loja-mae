import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Coupon } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle2, Gift } from 'lucide-react';
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
import { formatPrice } from '../../utils/format';

export default function AdminCouponsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      const response = await apiRequest<{ items: Coupon[]; total: number; totalPages: number }>(
        '/api/coupons'
      );
      return response.data?.items || [];
    },
  });

  // Filter coupons based on search
  const filteredCoupons = coupons?.filter(coupon =>
    coupon.code.toLowerCase().includes(search.toLowerCase())
  );

  // Create/Update coupon mutation
  const saveCouponMutation = useMutation({
    mutationFn: async (couponData: Partial<Coupon>) => {
      const endpoint = editingCoupon
        ? `/api/coupons/${editingCoupon.id}`
        : '/api/coupons';
      return apiRequest<Coupon>(endpoint, {
        method: editingCoupon ? 'PUT' : 'POST',
        body: JSON.stringify(couponData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast({ title: 'Cupom salvo', description: 'O cupom foi salvo com sucesso.' });
      setIsModalOpen(false);
      setEditingCoupon(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar cupom.', variant: 'destructive' });
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/coupons/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast({ title: 'Cupom deletado', description: 'O cupom foi deletado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao deletar cupom.', variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este cupom?')) {
      deleteCouponMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Coupon> = {
      code: formData.get('code') as string,
      type: formData.get('type') as Coupon['type'],
      value: parseFloat(formData.get('value') as string),
      min_purchase_cents: parseFloat(formData.get('min_purchase_cents') as string) * 100,
      max_discount_cents: formData.get('max_discount_cents') ? parseFloat(formData.get('max_discount_cents') as string) * 100 : null,
      usage_limit: formData.get('usage_limit') ? parseInt(formData.get('usage_limit') as string) : null,
      customer_limit: formData.get('customer_limit') ? parseInt(formData.get('customer_limit') as string) : 1,
      starts_at: formData.get('starts_at') as string || null,
      expires_at: formData.get('expires_at') as string || null,
      is_active: formData.get('is_active') === 'on' ? 1 : 0,
    };
    saveCouponMutation.mutate(data);
  };

  const getCouponValueDisplay = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    }
    return formatPrice(coupon.value);
  };

  const getStatusBadge = (isActive: number) => {
    return (
      <Badge variant={isActive === 1 ? 'default' : 'secondary'}>
        {isActive === 1 ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cupons</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus cupons de desconto</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar cupons por código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Coupons Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Carregando cupons...</p>
          </div>
        ) : !filteredCoupons || filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum cupom encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Uso Máximo</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{coupon.type === 'percentage' ? 'Percentual' : 'Fixo'}</TableCell>
                  <TableCell>{getCouponValueDisplay(coupon)}</TableCell>
                  <TableCell>{coupon.usage_limit || 'Ilimitado'}</TableCell>
                  <TableCell>{coupon.usage_count}</TableCell>
                  <TableCell>
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('pt-PT') : 'Nunca'}
                  </TableCell>
                  <TableCell>{getStatusBadge(coupon.is_active)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(coupon)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)}>
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

      {/* Coupon Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Código
              </Label>
              <Input
                id="code"
                name="code"
                defaultValue={editingCoupon?.code || ''}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select
                name="type"
                defaultValue={editingCoupon?.type || 'percentage'}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Valor
              </Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                defaultValue={editingCoupon?.type === 'fixed' ? (editingCoupon.value / 100) : editingCoupon?.value || ''}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min_purchase_cents" className="text-right">
                Compra Mínima (€)
              </Label>
              <Input
                id="min_purchase_cents"
                name="min_purchase_cents"
                type="number"
                step="0.01"
                defaultValue={editingCoupon?.min_purchase_cents ? (editingCoupon.min_purchase_cents / 100) : 0}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max_discount_cents" className="text-right">
                Desconto Máximo (€)
              </Label>
              <Input
                id="max_discount_cents"
                name="max_discount_cents"
                type="number"
                step="0.01"
                defaultValue={editingCoupon?.max_discount_cents ? (editingCoupon.max_discount_cents / 100) : ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usage_limit" className="text-right">
                Limite de Uso
              </Label>
              <Input
                id="usage_limit"
                name="usage_limit"
                type="number"
                step="1"
                defaultValue={editingCoupon?.usage_limit || ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_limit" className="text-right">
                Limite por Cliente
              </Label>
              <Input
                id="customer_limit"
                name="customer_limit"
                type="number"
                step="1"
                defaultValue={editingCoupon?.customer_limit || 1}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="starts_at" className="text-right">
                Início
              </Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                defaultValue={editingCoupon?.starts_at ? new Date(editingCoupon.starts_at).toISOString().slice(0, 16) : ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expires_at" className="text-right">
                Expira em
              </Label>
              <Input
                id="expires_at"
                name="expires_at"
                type="datetime-local"
                defaultValue={editingCoupon?.expires_at ? new Date(editingCoupon.expires_at).toISOString().slice(0, 16) : ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativo
              </Label>
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={editingCoupon?.is_active === 1}
                className="col-span-3 justify-self-start h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveCouponMutation.isPending}>
                {saveCouponMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Cupom'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
