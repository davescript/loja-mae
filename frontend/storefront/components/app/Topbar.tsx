import { Search, Menu, Filter } from 'lucide-react';
import { useState } from 'react';

type TopbarProps = {
  onOpenCategories?: () => void;
  onOpenFilters?: () => void;
};

export default function Topbar({ onOpenCategories, onOpenFilters }: TopbarProps) {
  const [query, setQuery] = useState('');
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
      <div className="flex items-center gap-3 h-16 px-4 lg:px-6">
        <button className="lg:hidden btn btn-muted" onClick={onOpenCategories} aria-label="Abrir categorias">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acessórios de bolo, toppers, caixas..."
            className="input pl-10"
          />
        </div>
        <button className="btn btn-muted" onClick={onOpenFilters} aria-label="Abrir filtros">
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
