import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Heart } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

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
      {/* Top Bar - Promoção com animação */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm py-2.5 relative overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-center">
            <p className="text-center">
              🎉 <strong>Maior Promoção do Ano!</strong> Use o cupom{' '}
              <strong className="bg-white/20 px-2 py-0.5 rounded">GET20OFF</strong> e ganhe 20% de desconto
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Header com glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Header Top - Social & Welcome */}
          <div className="hidden md:flex items-center justify-between py-2 text-xs text-muted-foreground border-b border-border/50">
            <div className="flex items-center gap-4">
              <span>✨ Bem-vindo à Loja Mãe</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary transition-colors">Facebook</a>
              <a href="#" className="hover:text-primary transition-colors">Instagram</a>
              <a href="#" className="hover:text-primary transition-colors">WhatsApp</a>
            </div>
          </div>

          {/* Header Main - Logo, Search, Actions */}
          <div className="flex items-center gap-4 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn btn-ghost p-2"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <motion.h1
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-heading font-bold gradient-text"
              >
                Loja Mãe
              </motion.h1>
            </Link>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-2xl mx-4"
            >
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="input pl-12 w-full bg-white/50 backdrop-blur-sm border-border/50 focus:bg-white focus:border-primary"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn btn-primary ml-2 px-6"
              >
                Buscar
              </motion.button>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Search Button - Mobile */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden btn btn-ghost p-2"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Favorites */}
              <Link
                to="/favorites"
                className="btn btn-ghost p-2 relative"
                aria-label="Favoritos"
              >
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-md">
                  0
                </span>
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="btn btn-ghost p-2 relative"
                aria-label="Carrinho"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-md">
                  0
                </span>
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <Link
                  to="/account"
                  className="btn btn-ghost p-2"
                  aria-label="Minha conta"
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary text-sm px-4"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Menu - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 py-3 border-t border-border/50">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Produtos' },
              { to: '/categories', label: 'Categorias' },
              { to: '/collections', label: 'Coleções' },
              { to: '/about', label: 'Sobre' },
              { to: '/contact', label: 'Contato' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium hover:text-primary transition-colors relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-sm p-4"
            >
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="input flex-1"
                  autoFocus
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-ghost p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-2">
                  {[
                    { to: '/', label: 'Home' },
                    { to: '/products', label: 'Produtos' },
                    { to: '/categories', label: 'Categorias' },
                    { to: '/collections', label: 'Coleções' },
                    { to: '/about', label: 'Sobre' },
                    { to: '/contact', label: 'Contato' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-muted transition-colors font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
