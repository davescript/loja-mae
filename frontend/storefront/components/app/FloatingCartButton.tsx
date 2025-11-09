import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloatingCartButton() {
  return (
    <Link
      to="/cart"
      className="fixed bottom-20 right-4 lg:right-8 z-40 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-elevated hover:scale-[1.02] transition"
      aria-label="Abrir carrinho"
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        <span className="hidden sm:block text-sm">Carrinho</span>
      </div>
    </Link>
  );
}

