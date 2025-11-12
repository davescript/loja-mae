import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Heart, Package } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function StoreHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Bar - Promoção */}
      <div className="bg-primary text-primary-foreground text-sm py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-center flex-1">
              🎉 <strong>Maior Promoção do Ano!</strong> Use o cupom{' '}
              <strong>GET20OFF</strong> e ganhe 20% de desconto
            </p>
            <button
              onClick={() => setSearchOpen(false)}
              className="hidden md:block text-primary-foreground/80 hover:text-primary-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          {/* Header Top - Social & Welcome */}
          <div className="hidden md:flex items-center justify-between py-2 text-sm text-muted-foreground border-b">
            <div className="flex items-center gap-4">
              <span>Bem-vindo à Loja Mãe</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary transition">Facebook</a>
              <a href="#" className="hover:text-primary transition">Instagram</a>
              <a href="#" className="hover:text-primary transition">WhatsApp</a>
            </div>
          </div>

          {/* Header Main - Logo, Search, Actions */}
          <div className="flex items-center gap-4 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn btn-muted"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-heading font-bold text-primary">
                Loja Mãe
              </h1>
            </Link>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-2xl mx-4"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="input pl-10 w-full"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary ml-2 px-6"
              >
                Buscar
              </button>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Search Button - Mobile */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden btn btn-muted"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Favorites */}
              <Link to="/favorites" className="btn btn-muted relative" aria-label="Favoritos">
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="btn btn-muted relative" aria-label="Carrinho">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <Link to="/account" className="btn btn-muted" aria-label="Minha conta">
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/login" className="btn btn-primary text-sm px-4">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Menu - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 py-3 border-t">
            <Link to="/" className="text-sm font-medium hover:text-primary transition">
              Home
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-primary transition">
              Produtos
            </Link>
            <Link to="/categories" className="text-sm font-medium hover:text-primary transition">
              Categorias
            </Link>
            <Link to="/collections" className="text-sm font-medium hover:text-primary transition">
              Coleções
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition">
              Sobre
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition">
              Contato
            </Link>
          </nav>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <div className="md:hidden border-t bg-white p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="input flex-1"
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav className="flex flex-col p-4 gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted transition"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted transition"
              >
                Produtos
              </Link>
              <Link
                to="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted transition"
              >
                Categorias
              </Link>
              <Link
                to="/collections"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted transition"
              >
                Coleções
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted transition"
              >
                Sobre
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted transition"
              >
                Contato
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
