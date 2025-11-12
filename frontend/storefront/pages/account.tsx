import { useAuth } from '../../hooks/useAuth';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="px-4 lg:px-6 py-12 text-center">
        <h1 className="text-xl font-medium mb-2">Área do Cliente</h1>
        <p className="text-sm text-muted-foreground">Você precisa entrar para acessar seu painel.</p>
        <a href="/login" className="mt-4 inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground">Entrar</a>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-xl font-medium">Minha Conta</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Dados pessoais</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
            <input className="px-3 py-2 rounded-xl border bg-white" placeholder="Nome" defaultValue={user?.first_name || ''} />
            <input className="px-3 py-2 rounded-xl border bg-white" placeholder="Sobrenome" defaultValue={user?.last_name || ''} />
            <input className="px-3 py-2 rounded-xl border bg-white" placeholder="Email" defaultValue={user?.email || ''} />
          </div>
          <button className="mt-3 px-4 py-2 rounded-full bg-muted text-sm" onClick={() => logout()}>Sair</button>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Histórico de pedidos</p>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe entregas e status.</p>
          <a href="/orders" className="mt-3 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Ver pedidos</a>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <p className="font-medium">Favoritos</p>
          <p className="mt-2 text-sm text-muted-foreground">Veja e gerencie seus itens favoritos.</p>
          <a href="/favorites" className="mt-3 inline-block px-4 py-2 rounded-full bg-muted text-sm">Abrir</a>
        </div>
      </div>
    </div>
  );
}
