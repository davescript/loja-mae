import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useCartStore } from '../../store/cartStore'
import { formatPrice } from '../../utils/format'
import { API_BASE_URL } from '../../utils/api'
import { useToast } from '../../admin/hooks/useToast'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../../admin/components/ui/button'
import { handleError } from '../../utils/errorHandler'

// Componente do formulário de pagamento
function CheckoutForm({ 
  clientSecret, 
  orderNumber,
  onSuccess 
}: { 
  clientSecret: string
  orderNumber: string | null
  onSuccess: (paymentIntentId: string) => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Falha ao processar pagamento')
        toast({
          title: 'Erro no pagamento',
          description: stripeError.message || 'Falha ao processar pagamento',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      }
    } catch (err: any) {
      const { message } = handleError(err)
      setError(message)
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          'Pagar Agora'
        )}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { items, getTotal, clearCart } = useCartStore()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [publishableKey, setPublishableKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  const total = getTotal()

  // Carregar chave pública do Stripe
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stripe/config`)
      .then((res) => res.json())
      .then((data: any) => {
        setPublishableKey(data.publishableKey || null)
      })
      .catch(() => setPublishableKey(null))
  }, [])

  // Criar Payment Intent quando a página carregar
  useEffect(() => {
    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho antes de finalizar a compra.',
        variant: 'destructive',
      })
      navigate('/cart')
      return
    }

    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    try {
      setCreating(true)
      
      const cartItems = items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
      }))

      const response = await fetch(`${API_BASE_URL}/api/stripe/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: cartItems,
        }),
      })

      const data = await response.json() as { client_secret?: string; order_number?: string; error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar pedido')
      }

      if (!data.client_secret) {
        throw new Error('Client secret não recebido')
      }

      setClientSecret(data.client_secret)
      setOrderNumber(data.order_number || null)
    } catch (error: any) {
      const { message } = handleError(error)
      toast({
        title: 'Erro',
        description: message || 'Erro ao iniciar checkout',
        variant: 'destructive',
      })
      navigate('/cart')
    } finally {
      setCreating(false)
    }
  }

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null
    return loadStripe(publishableKey)
  }, [publishableKey])

  const options: StripeElementsOptions = useMemo(() => {
    if (!clientSecret) return { clientSecret: '' }
    return {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#8B4513',
        },
      },
    }
  }, [clientSecret])

  const handlePaymentSuccess = (intentId: string) => {
    setPaymentSuccess(true)
    setPaymentIntentId(intentId)
    clearCart()
    
    setTimeout(() => {
      navigate(`/checkout/success?payment_intent=${intentId}&order=${orderNumber || ''}`)
    }, 2000)
  }

  if (items.length === 0 && !creating) {
    return null
  }

  if (creating) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-lg">Preparando seu pedido...</p>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-3xl font-bold mb-2">Pagamento Processado!</h1>
            <p className="text-muted-foreground">Redirecionando...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg">Erro ao carregar checkout. Tente novamente.</p>
          <Button onClick={() => navigate('/cart')} className="mt-4">
            Voltar ao Carrinho
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Pagamento */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-lg p-6 shadow-sm border"
            >
              <h2 className="text-xl font-bold mb-6">Informações de Pagamento</h2>
              
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  orderNumber={orderNumber}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </motion.div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-lg p-6 shadow-sm border sticky top-4"
            >
              <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.variant_id || 'default'}`} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price_cents * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {orderNumber && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Pedido: {orderNumber}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
