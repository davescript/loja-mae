import { useEffect, useMemo, useState } from 'react';
import { getItems, getSubtotalCents, clearCart } from '../../utils/cart';
import { API_BASE_URL } from '../../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

type Address = {
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  phone?: string;
};

function CheckoutForm({ clientSecret, orderNumber, onSuccess }: { clientSecret: string; orderNumber: string | null; onSuccess: (orderNumber: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    });
    setLoading(false);
    if (stripeError) {
      setError(stripeError.message || 'Falha ao processar pagamento');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Order number is tracked in backend via webhook; for now just clear cart and notify
      clearCart();
      onSuccess(orderNumber || '');
    }
  };

  return (
    <div>
      <PaymentElement />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button disabled={!stripe || loading} onClick={handlePay} className="mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground">
        {loading ? 'Processando...' : 'Finalizar compra'}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const [email, setEmail] = useState('');
  const [shipping, setShipping] = useState<Address>({ first_name: '', last_name: '', address_line1: '', city: '', state: '', postal_code: '', country: 'BR' });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const subtotal = useMemo(() => getSubtotalCents() / 100, []);

  useEffect(() => {
    // Load Stripe publishable key from backend
    fetch(`${API_BASE_URL}/api/stripe/config`)
      .then(res => res.json())
      .then((data: unknown) => {
        const typedData = data as { publishableKey?: string };
        setPublishableKey(typedData.publishableKey || null);
      })
      .catch(() => setPublishableKey(null));
  }, []);

  const stripePromise = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);

  const handleCreateOrder = async () => {
    try {
      setCreating(true);
      const items = getItems().map(it => ({ product_id: it.product_id, variant_id: it.variant_id ?? null, quantity: it.quantity }));
      const body = {
        email: email || 'guest@example.com',
        items,
        shipping_address: shipping,
      };
      const res = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { client_secret?: string; order_number?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao iniciar checkout');
      setClientSecret(data.client_secret || null);
      setOrderNumber(data.order_number || null);
    } catch (e: any) {
      alert(e.message || 'Erro ao criar pedido');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <h1 className="text-xl font-medium mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Passo 1: Endereço e Email */}
        <div className="lg:col-span-2 rounded-xl bg-card p-4 shadow-soft">
          {!clientSecret && (
            <>
              <p className="font-medium">Informações de Contato</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <p className="mt-8 font-medium">Endereço de Entrega</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Nome" value={shipping.first_name} onChange={(e) => setShipping({ ...shipping, first_name: e.target.value })} />
                <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Sobrenome" value={shipping.last_name} onChange={(e) => setShipping({ ...shipping, last_name: e.target.value })} />
                <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Rua e número" value={shipping.address_line1} onChange={(e) => setShipping({ ...shipping, address_line1: e.target.value })} />
                <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Cidade" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Estado" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} />
                <input className="px-3 py-3 rounded-xl border bg-white" placeholder="CEP" value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} />
                <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Telefone" value={shipping.phone || ''} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
              </div>
              <button disabled={!publishableKey || creating} onClick={handleCreateOrder} className="mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground">
                {creating ? 'Criando pedido...' : 'Continuar para pagamento'}
              </button>
              {!publishableKey && <p className="mt-2 text-xs text-red-600">Chave pública Stripe não carregada.</p>}
            </>
          )}

          {/* Passo 2: Pagamento Stripe Elements */}
          {clientSecret && publishableKey && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <p className="font-medium">Pagamento</p>
              <div className="mt-4">
                <CheckoutForm clientSecret={clientSecret} orderNumber={orderNumber} onSuccess={(number) => {
                  // Mostrar confirmação e link para pedidos
                  if (number) {
                    alert(`Pagamento confirmado! Número do pedido: ${number}`);
                  } else {
                    alert('Pagamento confirmado!');
                  }
                }} />
              </div>
            </Elements>
          )}
        </div>

        {/* Resumo */}
        <div className="rounded-xl bg-card p-4 shadow-soft h-max">
          <p className="text-sm text-muted-foreground">Resumo</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>R$ {subtotal.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between"><span>Envio</span><span>R$ 0,00</span></div>
            <div className="flex justify-between"><span>Impostos</span><span>R$ 0,00</span></div>
          </div>
          <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>R$ {subtotal.toFixed(2).replace('.', ',')}</span></div>
        </div>
      </div>
    </div>
  );
}
