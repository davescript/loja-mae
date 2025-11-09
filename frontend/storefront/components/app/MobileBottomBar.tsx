import { NavLink } from 'react-router-dom';
import { Home, Search, Layers, ShoppingCart, User } from 'lucide-react';

export default function MobileBottomBar() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-soft">
      <div className="grid grid-cols-5">
        <NavLink to="/" className="flex flex-col items-center justify-center py-2 text-xs">
          <Home className="w-5 h-5" />
          Home
        </NavLink>
        <NavLink to="/products" className="flex flex-col items-center justify-center py-2 text-xs">
          <Search className="w-5 h-5" />
          Buscar
        </NavLink>
        <NavLink to="/categories" className="flex flex-col items-center justify-center py-2 text-xs">
          <Layers className="w-5 h-5" />
          Categorias
        </NavLink>
        <NavLink to="/cart" className="flex flex-col items-center justify-center py-2 text-xs">
          <ShoppingCart className="w-5 h-5" />
          Carrinho
        </NavLink>
        <NavLink to="/account" className="flex flex-col items-center justify-center py-2 text-xs">
          <User className="w-5 h-5" />
          Conta
        </NavLink>
      </div>
    </nav>
  );
}

