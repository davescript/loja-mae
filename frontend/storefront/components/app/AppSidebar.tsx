import { NavLink } from 'react-router-dom';
import { Layers, CupSoda, PartyPopper, Box, Sparkles, ShoppingCart, Settings } from 'lucide-react';

export default function AppSidebar() {
  const items = [
    { to: '/', label: 'Home', icon: Sparkles },
    { to: '/categories', label: 'Categorias', icon: Layers },
    { to: '/products', label: 'Produtos', icon: Box },
    { to: '/favorites', label: 'Favoritos', icon: CupSoda },
    { to: '/orders', label: 'Pedidos', icon: ShoppingCart },
    { to: '/account', label: 'Conta', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="h-20 flex items-center px-6">
        <NavLink to="/" className="text-xl font-semibold">Confeitaria.app</NavLink>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl ${isActive ? 'bg-secondary text-primary' : 'hover:bg-muted'}`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
