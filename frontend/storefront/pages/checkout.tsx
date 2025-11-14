import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useCartStore } from '../../store/cartStore'
import { formatPrice } from '../../utils/format'
import { API_BASE_URL, apiRequest } from '../../utils/api'
import { useToast } from '../../admin/hooks/useToast'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, MapPin, Plus, Check } from 'lucide-react'
import { Button } from '../../admin/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../../admin/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../admin/components/ui/dialog'
import { Input } from '../../admin/components/ui/input'
import { Label } from '../../admin/components/ui/label'
import { Badge } from '../../admin/components/ui/badge'
import { handleError } from '../../utils/errorHandler'
import { useAuth } from '../../hooks/useAuth'
import type { Address, ApiResponse } from '@shared/types'
import { cn } from '../../utils/cn'

// Componente do formulário de pagamento
function CheckoutForm({ 
  clientSecret, 
  orderNumber,
  orderId,
  paymentIntentId,
  selectedAddress,
  customerEmail,
  onSuccess 
}: { 
  clientSecret: string
  orderNumber: string | null
  orderId: number | null
  paymentIntentId: string | null
  selectedAddress: Address | null
  customerEmail?: string | null
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
      if (!selectedAddress) {
        setError('Selecione um endereço de entrega antes de pagar.')
        toast({
          title: 'Selecione um endereço',
          description: 'Escolha ou adicione um endereço para continuar.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      if (!orderId || !paymentIntentId) {
        console.error('Missing orderId or paymentIntentId', { orderId, paymentIntentId })
        setError('Não foi possível identificar o pedido. Atualize a página e tente novamente.')
        toast({
          title: 'Erro no pedido',
          description: 'Não foi possível identificar o pedido. Atualize a página e tente novamente.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const normalizedAddress = {
        first_name: selectedAddress.first_name,
        last_name: selectedAddress.last_name,
        company: selectedAddress.company,
        address_line1: selectedAddress.address_line1,
        address_line2: selectedAddress.address_line2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postal_code: selectedAddress.postal_code,
        country: selectedAddress.country || 'PT',
        phone: selectedAddress.phone || '',
      }

      // Atualizar endereço do pedido antes de confirmar o pagamento
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/shipping`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            shipping_address: normalizedAddress,
            address_id: selectedAddress.id,
            payment_intent_id: paymentIntentId,
          }),
        })

        const data = await response.json() as ApiResponse
        if (!response.ok || data.success === false) {
          throw new Error(data.error || 'Falha ao salvar endereço de entrega')
        }
      } catch (err: any) {
        console.error('Erro ao salvar endereço no pedido:', err)
        const message = err?.message || 'Não foi possível salvar o endereço de entrega.'
        toast({
          title: 'Erro ao salvar endereço',
          description: message,
          variant: 'destructive',
        })
        setError(message)
        setLoading(false)
        return
      }

      const billingDetails: any = {
        name: `${normalizedAddress.first_name} ${normalizedAddress.last_name}`.trim(),
        email: customerEmail || undefined,
        phone: normalizedAddress.phone || undefined,
        address: {
          line1: normalizedAddress.address_line1,
          line2: normalizedAddress.address_line2 || undefined,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          postal_code: normalizedAddress.postal_code,
          country: normalizedAddress.country || 'PT',
        },
      }

      const shippingParams = {
        name: billingDetails.name,
        phone: normalizedAddress.phone || undefined,
        address: {
          line1: normalizedAddress.address_line1,
          line2: normalizedAddress.address_line2 || undefined,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          postal_code: normalizedAddress.postal_code,
          country: normalizedAddress.country || 'PT',
        },
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: billingDetails.name ? {
            billing_details: billingDetails,
          } : undefined,
          shipping: shippingParams,
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
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Entrega para</p>
            {selectedAddress ? (
              <div className="mt-1 space-y-1 text-muted-foreground">
                <p>{selectedAddress.first_name} {selectedAddress.last_name}</p>
                <p>{selectedAddress.address_line1}</p>
                {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                <p>{selectedAddress.postal_code} {selectedAddress.city}</p>
                <p>{selectedAddress.country}</p>
                {selectedAddress.phone && <p>Tel: {selectedAddress.phone}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">Selecione um endereço para continuar.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Dados de Pagamento</h3>
        <PaymentElement 
          options={{
            fields: {
              billingDetails: {
                name: 'never',
                email: 'never',
                phone: 'auto',
                address: 'never',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading || !selectedAddress}
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { items, getTotal, clearCart, loadFromServer } = useCartStore()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [publishableKey, setPublishableKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [loadingCart, setLoadingCart] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const addressInitialState = {
    first_name: '',
    last_name: '',
    company: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'PT',
    phone: '',
    is_default: false,
  }
  const [addressForm, setAddressForm] = useState(addressInitialState)
  const cartId = searchParams.get('cart_id')

  const {
    data: addresses = [],
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ['checkout-addresses'],
    queryFn: async () => {
      const response = await apiRequest<Address[]>('/api/customers/addresses')
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar endereços')
      }
      return response.data || []
    },
    enabled: isAuthenticated,
  })

  const addAddressMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiRequest<{ id: number; address: Address }>('/api/customers/addresses', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!response.success) {
        throw new Error(response.error || 'Erro ao salvar endereço')
      }
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: 'Endereço salvo',
        description: 'Endereço adicionado ao seu perfil.',
      })
      refetchAddresses()
      setIsAddressDialogOpen(false)
      setAddressForm(addressInitialState)
      const newId = (data as any)?.address?.id ?? (data as any)?.id ?? null
      if (newId) {
        setSelectedAddressId(newId)
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar endereço.',
        variant: 'destructive',
      })
    },
  })

  const total = getTotal()
  const selectedAddress = selectedAddressId
    ? addresses.find((addr) => addr.id === selectedAddressId) || null
    : null

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedAddressId(null)
      return
    }

    if (!addresses || addresses.length === 0) {
      setSelectedAddressId(null)
      return
    }

    const alreadySelected = selectedAddressId && addresses.some((addr) => addr.id === selectedAddressId)
    if (alreadySelected) {
      return
    }

    const defaultAddress = addresses.find((addr) => addr.is_default === 1) || addresses[0]
    setSelectedAddressId(defaultAddress?.id || null)
  }, [addresses, isAuthenticated, selectedAddressId])

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

  useEffect(() => {
    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho antes de finalizar a compra.',
        variant: 'destructive',
      })
      navigate('/cart')
    }
  }, [items.length, navigate, toast])

  useEffect(() => {
    if (items.length === 0) return
    if (authLoading) return
    if (!isAuthenticated) return
    if (!selectedAddressId) return
    if (addressesLoading) return
    if (clientSecret) return
    createPaymentIntent(selectedAddressId)
  }, [items.length, authLoading, isAuthenticated, selectedAddressId, addressesLoading, clientSecret])

  const createPaymentIntent = async (addressId?: number | null) => {
    try {
      setCreating(true)
      if (!addressId) {
        throw new Error('Selecione um endereço de entrega antes de continuar.')
      }
      
      const cartItems = items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
      }))

      // Incluir o endereço completo no payload para garantir criação mesmo sem cookie
      const normalizedAddress = selectedAddress ? {
        first_name: selectedAddress.first_name,
        last_name: selectedAddress.last_name,
        company: selectedAddress.company,
        address_line1: selectedAddress.address_line1,
        address_line2: selectedAddress.address_line2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postal_code: selectedAddress.postal_code,
        country: selectedAddress.country || 'PT',
        phone: selectedAddress.phone || null,
      } : undefined

      const apiResp = await apiRequest<{ 
        client_secret: string; 
        order_number: string; 
        order_id: number; 
        total_cents: number; 
        payment_intent_id: string; 
      }>(
        '/api/stripe/create-intent',
        {
          method: 'POST',
          body: JSON.stringify({
            items: cartItems,
            address_id: addressId,
            shipping_address: normalizedAddress,
          }),
        }
      )

      if (!apiResp.success) {
        const errorMsg = apiResp.error || 'Falha ao criar pedido'
        console.error('Erro na resposta:', { data: apiResp })
        throw new Error(errorMsg)
      }

      const data = apiResp.data!

      const clientSecret = data.client_secret
      const orderNum = data.order_number
      const createdOrderId = data.order_id ?? null
      const createdPaymentIntentId = data.payment_intent_id ?? null

      if (!clientSecret) {
        console.error('Resposta sem client_secret:', apiResp)
        throw new Error('Client secret não recebido da API')
      }

      setClientSecret(clientSecret)
      setOrderNumber(orderNum || null)
      setOrderId(createdOrderId)
      setPaymentIntentId(createdPaymentIntentId)
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

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addAddressMutation.mutateAsync({
        ...addressForm,
        type: 'shipping',
        is_default: addressForm.is_default || addresses.length === 0,
      })
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
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
      // Remover paymentMethodTypes - não é necessário aqui
      // O AddressElement e PaymentElement são configurados separadamente
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

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center space-y-4">
            <h1 className="text-2xl font-bold">Entre para continuar</h1>
            <p className="text-muted-foreground">
              Faça login para selecionar seus endereços e concluir a compra com segurança.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/login?redirect=/checkout')}
            >
              Fazer Login
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="mb-8">
          <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-2 text-primary">
              <span className="w-8 h-8 rounded-full border border-primary flex items-center justify-center">
                1
              </span>
              Endereço
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={cn(
              'flex items-center gap-2',
              selectedAddress ? 'text-primary' : 'text-muted-foreground'
            )}>
              <span className={cn(
                'w-8 h-8 rounded-full border flex items-center justify-center',
                selectedAddress ? 'border-primary' : 'border-muted-foreground/50'
              )}>
                2
              </span>
              Pagamento
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Endereços */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-lg p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">1. Endereço de Entrega</h2>
                <Dialog
                  open={isAddressDialogOpen}
                  onOpenChange={(open) => {
                    setIsAddressDialogOpen(open)
                    if (!open) {
                      setAddressForm(addressInitialState)
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Endereço
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Endereço</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">Nome *</Label>
                          <Input
                            id="first_name"
                            value={addressForm.first_name}
                            onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Sobrenome *</Label>
                          <Input
                            id="last_name"
                            value={addressForm.last_name}
                            onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address_line1">Endereço *</Label>
                        <Input
                          id="address_line1"
                          value={addressForm.address_line1}
                          onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="address_line2">Complemento</Label>
                        <Input
                          id="address_line2"
                          value={addressForm.address_line2}
                          onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade *</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Distrito *</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="postal_code">Código Postal *</Label>
                          <Input
                            id="postal_code"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="country">País *</Label>
                          <Input
                            id="country"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="is_default">Definir como endereço principal</Label>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddressDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={addAddressMutation.isPending}>
                          {addAddressMutation.isPending ? 'Salvando...' : 'Salvar Endereço'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {addressesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((s) => (
                    <div key={s} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        'flex gap-4 rounded-lg border p-4 cursor-pointer transition shadow-sm',
                        selectedAddressId === address.id
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="selected-address"
                        className="sr-only"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                      <MapPin className="w-5 h-5 mt-1 text-primary" />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {address.first_name} {address.last_name}
                          </p>
                          {address.is_default === 1 && (
                            <Badge variant="outline" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{address.address_line1}</p>
                        {address.address_line2 && <p className="text-muted-foreground">{address.address_line2}</p>}
                        <p className="text-muted-foreground">
                          {address.postal_code} {address.city} · {address.state}
                        </p>
                        <p className="text-muted-foreground">{address.country}</p>
                        {address.phone && <p className="text-muted-foreground mt-1">Tel: {address.phone}</p>}
                      </div>
                      {selectedAddressId === address.id && <Check className="w-5 h-5 text-primary" />}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum endereço cadastrado. Adicione um novo para continuar.
                </div>
              )}
            </motion.div>

            {/* Pagamento */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-lg p-6 shadow-sm border"
            >
              <h2 className="text-xl font-bold mb-6">2. Pagamento</h2>
              
              {!clientSecret || !stripePromise ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  {!publishableKey
                    ? 'Configuração do Stripe não encontrada. Contacte o suporte.'
                    : selectedAddressId
                    ? 'Preparando checkout seguro...'
                    : 'Selecione ou cadastre um endereço para habilitar o pagamento.'}
                </div>
              ) : (
                <Elements stripe={stripePromise} options={options} key={clientSecret}>
                  <CheckoutForm
                    clientSecret={clientSecret}
                    orderNumber={orderNumber}
                    orderId={orderId}
                    paymentIntentId={paymentIntentId}
                    selectedAddress={selectedAddress}
                    customerEmail={user?.email}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
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

              {selectedAddress && (
                <div className="mt-6 border-t pt-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Entrega</p>
                  <p>{selectedAddress.first_name} {selectedAddress.last_name}</p>
                  <p>{selectedAddress.address_line1}</p>
                  {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                  <p>{selectedAddress.postal_code} {selectedAddress.city}</p>
                  <p>{selectedAddress.country}</p>
                </div>
              )}

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
