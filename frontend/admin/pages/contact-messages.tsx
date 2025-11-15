import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { DataTable, type Column } from '../components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/useToast';
import { Mail, Eye, CheckCircle2, XCircle, RefreshCw, Archive, Reply, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  email_sent: number;
  email_error: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminContactMessagesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['admin', 'contact-messages', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const response = await apiRequest<{
        messages: ContactMessage[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/api/admin/contact-messages?${params.toString()}`);
      return response.data || { messages: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest(`/api/admin/contact-messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contact-messages'] });
      toast({
        title: 'Status atualizado',
        description: 'Status da mensagem atualizado com sucesso.',
      });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/contact-messages/${id}/resend-email`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contact-messages'] });
      toast({
        title: 'Email reenviado',
        description: 'Email reenviado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível reenviar o email.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      new: <Badge className="bg-blue-100 text-blue-800">Nova</Badge>,
      read: <Badge className="bg-gray-100 text-gray-800">Lida</Badge>,
      replied: <Badge className="bg-green-100 text-green-800">Respondida</Badge>,
      archived: <Badge className="bg-gray-200 text-gray-600">Arquivada</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.new;
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: 'name',
      header: 'Nome',
      accessor: (message) => (
        <div>
          <div className="font-medium">{message.name}</div>
          <div className="text-sm text-muted-foreground">{message.email}</div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Assunto',
      accessor: (message) => (
        <div className="max-w-md">
          <div className="font-medium truncate">{message.subject}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">{message.message}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (message) => getStatusBadge(message.status),
    },
    {
      key: 'email_sent',
      header: 'Email',
      accessor: (message) => (
        <div className="flex items-center gap-2">
          {message.email_sent ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm text-muted-foreground">
            {message.email_sent ? 'Enviado' : 'Falhou'}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Data',
      accessor: (message) => (
        <div className="text-sm">
          {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      accessor: (message) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedMessage(message)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          {!message.email_sent && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => resendEmailMutation.mutate(message.id)}
              disabled={resendEmailMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${resendEmailMutation.isPending ? 'animate-spin' : ''}`} />
              Reenviar
            </Button>
          )}
        </div>
      ),
    },
  ];

  const newMessages = messagesData?.messages.filter((m) => m.status === 'new').length || 0;
  const totalMessages = messagesData?.pagination.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensagens de Contato</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todas as mensagens recebidas através do formulário de contato
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Mensagens</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
              <Mail className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novas Mensagens</p>
                <p className="text-2xl font-bold text-blue-600">{newMessages}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold text-green-600">
                  {messagesData?.messages.filter((m) => m.email_sent).length || 0}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          Todas
        </Button>
        <Button
          variant={statusFilter === 'new' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('new')}
        >
          Novas ({newMessages})
        </Button>
        <Button
          variant={statusFilter === 'read' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('read')}
        >
          Lidas
        </Button>
        <Button
          variant={statusFilter === 'replied' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('replied')}
        >
          Respondidas
        </Button>
        <Button
          variant={statusFilter === 'archived' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('archived')}
        >
          Arquivadas
        </Button>
      </div>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : messagesData?.messages.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            <DataTable
              data={messagesData?.messages || []}
              columns={columns}
              pagination={{
                page,
                pageSize: 20,
                total: messagesData?.pagination.total || 0,
                onPageChange: setPage,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
            <DialogDescription>
              Mensagem recebida em{' '}
              {selectedMessage &&
                format(new Date(selectedMessage.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-base font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">
                    <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                      {selectedMessage.email}
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Assunto</label>
                <p className="text-base font-medium">{selectedMessage.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-base whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Enviado</label>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedMessage.email_sent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Sim</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Não</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedMessage.email_error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Erro no envio:</strong> {selectedMessage.email_error}
                  </p>
                </div>
              )}

              {selectedMessage.ip_address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="text-sm font-mono">{selectedMessage.ip_address}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedMessage.status !== 'read') {
                      updateStatusMutation.mutate({ id: selectedMessage.id, status: 'read' });
                      setSelectedMessage({ ...selectedMessage, status: 'read' });
                    }
                  }}
                  disabled={selectedMessage.status === 'read'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Marcar como Lida
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedMessage.id, status: 'replied' });
                    setSelectedMessage({ ...selectedMessage, status: 'replied' });
                  }}
                  disabled={selectedMessage.status === 'replied'}
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Marcar como Respondida
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedMessage.id, status: 'archived' });
                    setSelectedMessage({ ...selectedMessage, status: 'archived' });
                  }}
                  disabled={selectedMessage.status === 'archived'}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar
                </Button>
                {!selectedMessage.email_sent && (
                  <Button
                    variant="default"
                    onClick={() => resendEmailMutation.mutate(selectedMessage.id)}
                    disabled={resendEmailMutation.isPending}
                  >
                    {resendEmailMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Reenviar Email
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`;
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Responder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

