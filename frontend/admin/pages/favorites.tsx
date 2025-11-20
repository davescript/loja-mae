import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { DataTable, type Column } from '../components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Heart, User, Package, Calendar, Search } from 'lucide-react';
import { formatPrice } from '../../utils/format';

interface Favorite {
  id: number;
  customer_id: number;
  product_id: number;
  customer_email?: string;
  product_title?: string;
  created_at: string;
}

export default function AdminFavoritesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerFavorites, setCustomerFavorites] = useState<Array<{ product_id: number; product_title?: string; created_at: string }>>([]);

  const { data: favoritesData = { favorites: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } }, isLoading, isFetching } = useQuery<{
    favorites: Favorite[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }>({
    queryKey: ['admin', 'favorites', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString(),
      });
      const response = await apiRequest<{
        favorites: Favorite[];
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
      }>(`/api/admin/favorites?${params.toString()}`);
      return response.data || { favorites: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } };
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });

  const handleViewCustomerFavorites = async (customerId: number) => {
    try {
      const response = await apiRequest<{ favorites: Array<{ product_id: number; product_title?: string; created_at: string }> }>(
        `/api/admin/favorites/customer/${customerId}`
      );
      if (response.data?.favorites) {
        setCustomerFavorites(response.data.favorites);
        setSelectedCustomerId(customerId);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos do cliente:', error);
    }
  };

  const filteredFavorites = favoritesData?.favorites?.filter((fav) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      fav.customer_email?.toLowerCase().includes(searchLower) ||
      fav.product_title?.toLowerCase().includes(searchLower) ||
      fav.product_id.toString().includes(searchLower)
    );
  }) || [];

  const columns: Column<Favorite>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      accessor: (favorite) => favorite.id,
    },
    {
      key: 'customer',
      header: 'Cliente',
      sortable: true,
      accessor: (favorite) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{favorite.customer_email || `ID: ${favorite.customer_id}`}</div>
            <div className="text-xs text-muted-foreground">ID: {favorite.customer_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Produto',
      sortable: true,
      accessor: (favorite) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{favorite.product_title || `ID: ${favorite.product_id}`}</div>
            <div className="text-xs text-muted-foreground">ID: {favorite.product_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Data',
      sortable: true,
      accessor: (favorite) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(favorite.created_at).toLocaleDateString('pt-PT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      accessor: (favorite) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewCustomerFavorites(favorite.customer_id)}
        >
          Ver Favoritos do Cliente
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Favoritos</h1>
          <p className="text-muted-foreground">Gerencie os produtos favoritos dos clientes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Favoritos</CardTitle>
          <CardDescription>
            Total: {favoritesData?.pagination?.total || 0} favoritos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, produto ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable
            data={filteredFavorites}
            columns={columns}
            loading={isLoading}
            pagination={{
              page,
              pageSize: 20,
              total: favoritesData?.pagination?.total || 0,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      {/* Dialog para ver favoritos de um cliente específico */}
      <Dialog open={selectedCustomerId !== null} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Favoritos do Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {customerFavorites.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum favorito encontrado para este cliente.</p>
            ) : (
              <div className="space-y-2">
                {customerFavorites.map((fav) => (
                  <div
                    key={fav.product_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{fav.product_title || `Produto ID: ${fav.product_id}`}</div>
                        <div className="text-xs text-muted-foreground">
                          Adicionado em{' '}
                          {new Date(fav.created_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">ID: {fav.product_id}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

