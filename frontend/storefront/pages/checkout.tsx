import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
        // Log detalhado para debug
        console.error('Erro do Stripe:', {
          type: stripeError.type,
          code: (stripeError as any).code,
          message: stripeError.message,
          decline_code: (stripeError as any).decline_code,
        })

        // Mensagens de erro mais específicas
        let errorMessage = 'Falha ao processar pagamento'
        let errorTitle = 'Erro no pagamento'

        if (stripeError.type === 'card_error') {
          errorTitle = 'Cartão recusado'
          const errorCode = (stripeError as any).code || (stripeError as any).decline_code
          
          switch (errorCode) {
            case 'card_declined':
            case 'generic_decline':
              errorMessage = 'Seu cartão foi recusado. Verifique os dados ou use outro cartão.'
              break
            case 'insufficient_funds':
              errorMessage = 'Saldo insuficiente. Use outro cartão ou método de pagamento.'
              break
            case 'expired_card':
              errorMessage = 'Cartão expirado. Use outro cartão.'
              break
            case 'incorrect_cvc':
              errorMessage = 'Código de segurança incorreto. Verifique e tente novamente.'
              break
            case 'processing_error':
              errorMessage = 'Erro ao processar o pagamento. Tente novamente.'
              break
            default:
              errorMessage = stripeError.message || 'Seu método de pagamento foi recusado. Tente outro cartão.'
          }
        } else if (stripeError.type === 'validation_error') {
          errorTitle = 'Dados inválidos'
          errorMessage = stripeError.message || 'Verifique os dados do pagamento e tente novamente.'
        } else {
          errorMessage = stripeError.message || 'Erro ao processar pagamento. Tente novamente.'
        }

        setError(errorMessage)
        toast({
          title: errorTitle,
          description: errorMessage,
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
      <PaymentElement 
        options={{
          fields: {
            billingDetails: {
              name: 'never',
              email: 'never',
              phone: 'auto',
              address: {
                country: 'never',
              },
            },
          },
        }}
      />
      
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
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { items, getTotal, clearCart, loadFromServer } = useCartStore()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [publishableKey, setPublishableKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [loadingCart, setLoadingCart] = useState(false)
  const cartId = searchParams.get('cart_id')

  const total = getTotal()

  // Carregar carrinho abandonado se cart_id estiver na URL
  useEffect(() => {
    if (cartId) {
      setLoadingCart(true)
      fetch(`${API_BASE_URL}/api/cart?cart_id=${cartId}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data: any) => {
          if (data.success && data.data?.items) {
            // Adicionar itens ao carrinho
            const cartItems = data.data.items.map((item: any) => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              title: item.title,
              price_cents: item.price_cents,
              quantity: item.quantity,
              image_url: item.image_url,
              sku: item.sku,
            }))
            
            // Limpar carrinho atual e adicionar itens do carrinho abandonado
            clearCart()
            cartItems.forEach((item: any) => {
              for (let i = 0; i < item.quantity; i++) {
                // useCartStore addItem será chamado via sync
              }
            })
            
            // Sincronizar com servidor
            loadFromServer()
            
            toast({
              title: 'Carrinho recuperado',
              description: 'Seus itens foram restaurados com sucesso',
            })
          }
        })
        .catch((error) => {
          console.error('Erro ao carregar carrinho:', error)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar o carrinho',
            variant: 'destructive',
          })
        })
        .finally(() => {
          setLoadingCart(false)
        })
    }
  }, [cartId, clearCart, loadFromServer, toast])

  // Carregar chave pública do Stripe
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stripe/config`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data: any) => {
        const key = data.data?.publishableKey || data.publishableKey
        if (!key) {
          console.error('Publishable key não encontrada na resposta:', data)
          toast({
            title: 'Erro de configuração',
            description: 'Stripe não está configurado corretamente',
            variant: 'destructive',
          })
        }
        setPublishableKey(key || null)
      })
      .catch((error) => {
        console.error('Erro ao carregar chave pública do Stripe:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a configuração do Stripe',
          variant: 'destructive',
        })
        setPublishableKey(null)
      })
  }, [toast])

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

      const data = await response.json() as { 
        success?: boolean;
        data?: { 
          client_secret?: string; 
          order_number?: string; 
          order_id?: number;
          total_cents?: number;
        };
        error?: string;
        // Fallback para formato antigo
        client_secret?: string;
        order_number?: string;
      }

      if (!response.ok) {
        const errorMsg = (data as any).error || (data as any).data?.error || 'Falha ao criar pedido'
        console.error('Erro na resposta:', { status: response.status, data })
        throw new Error(errorMsg)
      }

      // Suportar ambos os formatos de resposta (com e sem wrapper success/data)
      const clientSecret = data.data?.client_secret || data.client_secret
      const orderNum = data.data?.order_number || data.order_number

      if (!clientSecret) {
        console.error('Resposta sem client_secret:', data)
        throw new Error('Client secret não recebido da API')
      }

      setClientSecret(clientSecret)
      setOrderNumber(orderNum || null)
    } catch (error: any) {
      console.error('Erro ao criar Payment Intent:', error)
      const { message } = handleError(error)
      toast({
        title: 'Erro ao criar pedido',
        description: message || 'Erro ao iniciar checkout. Verifique se há produtos no carrinho.',
        variant: 'destructive',
      })
      // Não navegar automaticamente - deixar usuário tentar novamente
      // navigate('/cart')
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
      // IMPORTANTE: Configurar PaymentElement para coletar endereço de entrega
      fields: {
        billingDetails: {
          name: 'never', // Não coletar nome separadamente (já está no endereço)
          email: 'never', // Não coletar email (já temos)
          phone: 'auto', // Coletar telefone se necessário
          address: {
            country: 'never', // País já definido como PT
          },
        },
      },
      // Solicitar endereço de entrega
      paymentMethodTypes: ['card'],
    }
  }, [clientSecret])

  const handlePaymentSuccess = async (intentId: string) => {
    setPaymentSuccess(true)
    setPaymentIntentId(intentId)
    
    // Sincronizar status do pagamento imediatamente após sucesso
    // Isso garante que o status seja atualizado mesmo se o webhook falhar
    try {
      if (orderNumber) {
        await fetch(`${API_BASE_URL}/api/orders/sync-payment?order_number=${orderNumber}&payment_intent_id=${intentId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error syncing payment status:', error);
      // Não bloquear o fluxo se a sincronização falhar
    }
    
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
    const errorMessage = !publishableKey 
      ? 'Chave pública do Stripe não carregada'
      : !clientSecret
      ? 'Payment Intent não foi criado'
      : 'Erro ao carregar checkout'
    
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg mb-2">{errorMessage}</p>
          {creating && (
            <p className="text-sm text-muted-foreground mb-4">Aguarde, estamos processando...</p>
          )}
          <div className="space-y-2">
            <Button onClick={() => navigate('/cart')} className="mt-4">
              Voltar ao Carrinho
            </Button>
            {!creating && (
              <Button 
                onClick={() => {
                  setClientSecret(null)
                  setPublishableKey(null)
                  createPaymentIntent()
                }} 
                variant="outline"
                className="ml-2"
              >
                Tentar Novamente
              </Button>
            )}
          </div>
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
