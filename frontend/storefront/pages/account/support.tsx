import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../admin/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../../admin/components/ui/card';
import { Button } from '../../../admin/components/ui/button';
import { Input } from '../../../admin/components/ui/input';
import { Textarea } from '../../../admin/components/ui/textarea';
import { Label } from '../../../admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../admin/components/ui/select';
import { Badge } from '../../../admin/components/ui/badge';
import { HeadphonesIcon, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SupportTicket = {
  id: number;
  order_id: number | null;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  order?: {
    order_number: string;
  };
};

export default function CustomerSupportPage() {
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    order_id: location.state?.orderId || null,
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  // Fetch tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['customer-support-tickets'],
    queryFn: async () => {
      const response = await apiRequest<SupportTicket[]>('/api/customers/support/tickets');
      return response.data || [];
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/customers/support/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Ticket criado',
        description: 'Seu ticket de suporte foi criado com sucesso. Responderemos em breve.',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-support-tickets'] });
      setIsCreating(false);
      setFormData({
        order_id: null,
        subject: '',
        message: '',
        priority: 'medium',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar ticket.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      open: { variant: 'default', label: 'Aberto' },
      in_progress: { variant: 'secondary', label: 'Em Andamento' },
      resolved: { variant: 'outline', label: 'Resolvido' },
      closed: { variant: 'outline', label: 'Fechado' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      low: { variant: 'outline', label: 'Baixa' },
      medium: { variant: 'default', label: 'Média' },
      high: { variant: 'secondary', label: 'Alta' },
      urgent: { variant: 'destructive', label: 'Urgente' },
    };
    const config = variants[priority] || { variant: 'outline', label: priority };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    createTicketMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Suporte</h1>
        <p className="text-muted-foreground">
          Entre em contato conosco para qualquer dúvida ou problema.
        </p>
      </div>

      {/* Create Ticket Form */}
      {!isCreating ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <HeadphonesIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Precisa de Ajuda?</h3>
              <p className="text-muted-foreground mb-4">
                Crie um ticket de suporte e nossa equipe responderá o mais rápido possível.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Criar Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Criar Ticket de Suporte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Problema com meu pedido"
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Descreva seu problema ou dúvida..."
                  rows={6}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({
                      order_id: null,
                      subject: '',
                      message: '',
                      priority: 'medium',
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTicketMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {createTicketMutation.isPending ? 'Enviando...' : 'Enviar Ticket'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Meus Tickets</h2>
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                  {ticket.message}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    {ticket.order && (
                      <span>Pedido: {ticket.order.order_number} • </span>
                    )}
                    Criado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum ticket encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não criou nenhum ticket de suporte.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

