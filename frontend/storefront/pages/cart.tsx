import { useEffect, useState } from 'react';
import { getItems, updateQuantity, removeItem, getSubtotalCents } from '../../utils/cart';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/format';

export default function CartPage() {
  const [items, setItems] = useState(getItems());
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getItems());
  }, []);

  const handleQty = (product_id: number, variant_id: number | null, qty: number) => {
    updateQuantity(product_id, variant_id, qty);
    setItems(getItems());
  };

  const handleRemove = (product_id: number, variant_id: number | null) => {
    removeItem(product_id, variant_id);
    setItems(getItems());
  };

  const subtotal = getSubtotalCents() / 100;
  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel lateral minimalista */}
        <div className="lg:col-span-2 rounded-xl bg-card p-4 shadow-soft">
          <h1 className="text-xl font-medium">Seu carrinho</h1>
          <div className="mt-4 space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
            )}
            {items.map((it) => (
              <div key={`${it.product_id}-${it.variant_id ?? 'nv'}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <img src={it.image_url || ''} alt={it.title} className="w-16 h-16 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(it.price_cents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 rounded-md bg-white border" onClick={() => handleQty(it.product_id, it.variant_id ?? null, it.quantity - 1)}>-</button>
                  <input className="w-10 text-center rounded-md border" value={it.quantity} onChange={(e) => handleQty(it.product_id, it.variant_id ?? null, parseInt(e.target.value) || 1)} />
                  <button className="px-2 py-1 rounded-md bg-white border" onClick={() => handleQty(it.product_id, it.variant_id ?? null, it.quantity + 1)}>+</button>
                </div>
                <button className="ml-3 text-xs text-red-600" onClick={() => handleRemove(it.product_id, it.variant_id ?? null)}>Remover</button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <input className="flex-1 px-3 py-2 rounded-lg border bg-white" placeholder="Cupão" />
            <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground">Aplicar</button>
          </div>
        </div>

        {/* Resumo sempre visível */}
        <div className="rounded-xl bg-card p-4 shadow-soft h-max">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="text-2xl font-semibold text-primary">{formatPrice(Math.round(subtotal * 100))}</p>
          <button className="mt-4 w-full px-4 py-3 rounded-full bg-primary text-primary-foreground" onClick={() => navigate('/checkout')}>Ir para Checkout</button>
          <p className="mt-2 text-xs text-muted-foreground">Impostos e envio calculados no checkout.</p>
        </div>
      </div>
    </div>
  );
}
