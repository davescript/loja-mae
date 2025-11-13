import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { formatPrice } from '../../utils/format';

type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_cents: number;
  created_at: string;
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      const res = await apiRequest<{ items: Order[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/orders?page=1&pageSize=20`);
      return res.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">Meus Pedidos</h1>
        <p className="text-muted-foreground">Faça login para ver seus pedidos.</p>
        <a href="/login" className="mt-4 inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground">Entrar</a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Meus Pedidos</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-red-600">Erro ao carregar pedidos.</p>}
      <div className="space-y-3">
        {data?.items?.length ? (
          data.items.map((order) => (
            <div key={order.id} className="rounded-xl bg-card p-4 shadow-soft flex items-center justify-between">
              <div>
                <p className="font-medium">Pedido #{order.order_number}</p>
                <p className="text-sm text-muted-foreground">Criado em {new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="text-sm">
                <span className="mr-3">Status: <strong>{order.status}</strong></span>
                <span className="mr-3">Pagamento: <strong>{order.payment_status}</strong></span>
                <span>Total: {formatPrice(order.total_cents)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
        )}
      </div>
    </div>
  );
}
