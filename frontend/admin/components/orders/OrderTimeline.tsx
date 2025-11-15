import { motion } from 'framer-motion';
import { Check, Package, Truck, Home, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineEvent {
  id: number;
  event_type: string;
  description?: string;
  location?: string;
  created_at: string;
}

interface OrderTimelineProps {
  status: string;
  payment_status: string;
  created_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  tracking_events?: TimelineEvent[];
}

export function OrderTimeline({
  status,
  payment_status,
  created_at,
  shipped_at,
  delivered_at,
  tracking_events = [],
}: OrderTimelineProps) {
  const steps = [
    {
      key: 'created',
      label: 'Pedido Criado',
      icon: Clock,
      completed: true,
      date: created_at,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'paid',
      label: 'Pagamento Confirmado',
      icon: Check,
      completed: payment_status === 'paid',
      date: tracking_events.find((e) => e.event_type === 'paid')?.created_at,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      key: 'processing',
      label: 'Em Preparação',
      icon: Package,
      completed: ['processing', 'shipped', 'delivered'].includes(status),
      date: tracking_events.find((e) => e.event_type === 'processing')?.created_at,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'shipped',
      label: 'Enviado',
      icon: Truck,
      completed: ['shipped', 'delivered'].includes(status),
      date: shipped_at || tracking_events.find((e) => e.event_type === 'shipped')?.created_at,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      key: 'delivered',
      label: 'Entregue',
      icon: Home,
      completed: status === 'delivered',
      date: delivered_at || tracking_events.find((e) => e.event_type === 'delivered')?.created_at,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (status === 'cancelled' || status === 'refunded') {
    steps.push({
      key: status,
      label: status === 'cancelled' ? 'Cancelado' : 'Reembolsado',
      icon: XCircle,
      completed: true,
      date: tracking_events.find((e) => e.event_type === status)?.created_at,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    });
  }

  return (
    <div className="space-y-6">
      {/* Timeline Principal */}
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4 pb-8"
            >
              {/* Linha vertical */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-12 w-0.5 h-full -ml-px ${
                    step.completed ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Ícone */}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                  step.completed
                    ? `${step.color} ${step.bgColor} ring-4 ring-white`
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pt-1">
                <p className={`font-semibold ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(step.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Eventos Detalhados */}
      {tracking_events && tracking_events.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h4 className="font-semibold mb-4">Eventos de Rastreamento</h4>
          <div className="space-y-3">
            {tracking_events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  {event.description && <p className="text-muted-foreground mt-1">{event.description}</p>}
                  {event.location && (
                    <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

