import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import { Card, CardContent } from '../../../admin/components/ui/card';
import { Badge } from '../../../admin/components/ui/badge';
import { Button } from '../../../admin/components/ui/button';
import { Bell, Package, CheckCircle2, Truck, DollarSign, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  order_id: number | null;
  is_read: number;
  created_at: string;
};

export default function CustomerNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['customer-notifications'],
    queryFn: async () => {
      const response = await apiRequest<Notification[]>('/api/customers/notifications');
      return response.data || [];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/customers/notifications/${id}/read`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/customers/notifications/read-all', {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications', 'unread-count'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, any> = {
      order_received: Package,
      payment_confirmed: CheckCircle2,
      order_shipped: Truck,
      order_delivered: CheckCircle2,
      refund_issued: DollarSign,
      data_updated: Bell,
    };
    return icons[type] || Bell;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.order_id) {
      // Fetch order number first or navigate directly
      navigate('/account/orders');
    }
  };

  const unreadCount = (notifications || [])?.filter((n: Notification) => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notificações</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atualizações dos seus pedidos.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification: Notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        !notification.is_read
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-medium ${
                            !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <Badge variant="default" className="ml-2">
                            Nova
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground">
              Você não tem notificações no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

