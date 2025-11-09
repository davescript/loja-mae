export default function CartPage() {
  const items = [
    { id: 1, title: 'Topo de bolo "Feliz Aniversário"', price: 49.9, qty: 1, img: 'https://images.unsplash.com/photo-1542326237-94b1c5a884b7?q=80&w=600&auto=format&fit=crop' },
    { id: 2, title: 'Caixa para bolo 25x25', price: 29.9, qty: 2, img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=600&auto=format&fit=crop' },
  ];
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel lateral minimalista */}
        <div className="lg:col-span-2 rounded-xl bg-card p-4 shadow-soft">
          <h1 className="text-xl font-medium">Seu carrinho</h1>
          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <img src={it.img} alt={it.title} className="w-16 h-16 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{it.title}</p>
                  <p className="text-xs text-muted-foreground">R$ {it.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 rounded-md bg-white border">-</button>
                  <input className="w-10 text-center rounded-md border" defaultValue={it.qty} />
                  <button className="px-2 py-1 rounded-md bg-white border">+</button>
                </div>
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
          <p className="text-2xl font-semibold text-primary">R$ {subtotal.toFixed(2).replace('.', ',')}</p>
          <button className="mt-4 w-full px-4 py-3 rounded-full bg-primary text-primary-foreground">Ir para Checkout</button>
          <p className="mt-2 text-xs text-muted-foreground">Impostos e envio calculados no checkout.</p>
        </div>
      </div>
    </div>
  );
}
