import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../../utils/api'
import { formatPrice } from '../../../utils/format'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Mail, Home, ShoppingBag } from 'lucide-react'
import { Button } from '../../../admin/components/ui/button'

interface Order {
  id: number
  order_number: string
  total_cents: number
  status: string
  payment_status: string
  created_at: string
  items?: Array<{
    id: number
    product_title: string
    quantity: number
    price_cents: number
  }>
}

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paymentIntentId = searchParams.get('payment_intent')
  const orderNumber = searchParams.get('order')

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null
      const response = await apiRequest<Order>(`/api/orders/${orderNumber}`)
      return response.data
    },
    enabled: !!orderNumber,
    retry: 2,
  })

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <CheckCircle2 className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <h1 className="text-4xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-lg text-muted-foreground">
            Obrigado pela sua compra. Seu pedido foi processado com sucesso.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="bg-card rounded-lg p-8 shadow-sm border">
            <p>Carregando detalhes do pedido...</p>
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-lg p-8 shadow-sm border text-left space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold mb-4">Detalhes do Pedido</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número do Pedido:</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">{formatPrice(order.total_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {order.payment_status === 'paid' ? 'Pago' : order.status}
                  </span>
                </div>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Itens do Pedido:</h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product_title} x {item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.price_cents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentIntentId && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  ID do Pagamento: {paymentIntentId}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                <Mail className="w-4 h-4 inline mr-2" />
                Um email de confirmação foi enviado para você.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg p-8 shadow-sm border"
          >
            <p className="text-muted-foreground mb-4">
              Seu pagamento foi processado com sucesso!
            </p>
            {paymentIntentId && (
              <p className="text-xs text-muted-foreground">
                ID: {paymentIntentId}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Button onClick={() => navigate('/orders')} variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Ver Meus Pedidos
          </Button>
          <Button onClick={() => navigate('/products')}>
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continuar Comprando
          </Button>
          <Link to="/">
            <Button variant="ghost">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

