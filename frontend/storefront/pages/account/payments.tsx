import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '../../../admin/components/ui/card';
import { Badge } from '../../../admin/components/ui/badge';
import { CreditCard, Download } from 'lucide-react';
import { Button } from '../../../admin/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Payment = {
  id: number;
  order_id: number;
  order_number: string;
  status: string;
  provider: string;
  provider_id: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  order?: {
    id: number;
    order_number: string;
    total_cents: number;
  };
};

export default function CustomerPaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['customer-payments'],
    queryFn: async () => {
      const response = await apiRequest<Payment[]>('/api/customers/payments');
      return response.data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pendente' },
      succeeded: { variant: 'default', label: 'Confirmado' },
      failed: { variant: 'destructive', label: 'Falhou' },
      refunded: { variant: 'destructive', label: 'Reembolsado' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meus Pagamentos</h1>
        <p className="text-muted-foreground">
          Histórico de todos os seus pagamentos e transações.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : payments && payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <span className="font-semibold">Pedido {payment.order_number}</span>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Valor:</span>{' '}
                        <span className="font-semibold text-foreground">
                          {formatPrice(payment.amount_cents)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Método:</span> {payment.provider}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span>{' '}
                        {format(new Date(payment.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    {payment.provider_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        ID da Transação: <span className="font-mono">{payment.provider_id}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { downloadInvoicePDF } = await import('../../../utils/invoice');
                        await downloadInvoicePDF(payment.order_id);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Fatura
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum pagamento encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não realizou nenhum pagamento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

