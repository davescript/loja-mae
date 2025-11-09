export default function AccountPage() {
  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-xl font-medium">Dashboard do Cliente</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Favoritos</p>
          <p className="mt-2 text-sm text-muted-foreground">Veja e gerencie seus itens favoritos.</p>
          <a href="/favorites" className="mt-3 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Abrir</a>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Histórico de pedidos</p>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe entregas e status.</p>
          <a href="/orders" className="mt-3 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Abrir</a>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Endereços</p>
          <p className="mt-2 text-sm text-muted-foreground">Gerencie locais de entrega.</p>
          <button className="mt-3 px-4 py-2 rounded-full bg-muted text-sm">Adicionar</button>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Dados pessoais</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
            <input className="px-3 py-2 rounded-xl border bg-white" placeholder="Nome" />
            <input className="px-3 py-2 rounded-xl border bg-white" placeholder="Email" />
          </div>
          <button className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Guardar alterações</button>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Notificações</p>
          <p className="mt-2 text-sm text-muted-foreground">Receba atualizações e promoções.</p>
          <div className="mt-3 flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Email</span>
          </div>
        </div>
      </div>
    </div>
  );
}
