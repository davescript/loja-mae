export default function CheckoutPage() {
  return (
    <div className="px-4 lg:px-6 py-6">
      <h1 className="text-xl font-medium mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Passo 1: Endereço */}
        <div className="lg:col-span-2 rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Endereço de Entrega</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Nome" />
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Sobrenome" />
            <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Rua e número" />
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Cidade" />
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Estado" />
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="CEP" />
            <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Telefone" />
          </div>

          {/* Passo 2: Pagamento */}
          <p className="mt-8 font-medium">Pagamento</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Número do cartão" />
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="Validade" />
            <input className="px-3 py-3 rounded-xl border bg-white" placeholder="CVV" />
            <input className="px-3 py-3 rounded-xl border bg-white md:col-span-2" placeholder="Nome no cartão" />
          </div>
          <button className="mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground">Finalizar compra</button>
        </div>

        {/* Resumo */}
        <div className="rounded-xl bg-card p-4 shadow-soft h-max">
          <p className="text-sm text-muted-foreground">Resumo</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>R$ 129,70</span></div>
            <div className="flex justify-between"><span>Envio</span><span>R$ 20,00</span></div>
            <div className="flex justify-between"><span>Impostos</span><span>R$ 10,00</span></div>
          </div>
          <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>R$ 159,70</span></div>
        </div>
      </div>
    </div>
  );
}
