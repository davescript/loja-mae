import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCartStore } from '../../../store/cartStore';
import { useFavoritesStore } from '../../../store/favoritesStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import type { Product } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoreHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();
  const { getItemCount } = useCartStore();
  const { favorites } = useFavoritesStore(); // Usar favorites diretamente para re-renderizar
  const navigate = useNavigate();
  
  const cartItemCount = getItemCount();
  const favoritesCount = favorites.length; // Calcular do array diretamente
  
  // Debounce search query para evitar muitas requisições
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Buscar produtos enquanto digita
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['products', 'search', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 2) {
        return [];
      }
      try {
        const params = new URLSearchParams({
          search: debouncedSearchQuery,
          pageSize: '5',
          status: 'active',
          include: 'images',
        });
        const response = await apiRequest<{ items: Product[] }>(
          `/api/products?${params.toString()}`
        );
        return response.data?.items || [];
      } catch (error) {
        console.error('Error searching products:', error);
        return [];
      }
    },
    enabled: debouncedSearchQuery.length >= 2,
    staleTime: 5000,
  });

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setShowSuggestions(false);
    }
  };
  
  const handleProductClick = (product: Product) => {
    if (product.slug) {
      navigate(`/product/${product.slug}`);
    }
    setSearchQuery('');
    setShowSuggestions(false);
    setSearchOpen(false);
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
              <span>✨ Bem-vindo à Leiasabores</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/leiasabores" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Facebook</a>
              <a href="https://www.instagram.com/leiasabores/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
              <a href="https://wa.me/351969407406" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">WhatsApp</a>
            </div>
          </div>

          {/* Header Main - Logo, Search, Actions - Centralizado */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn btn-ghost p-2"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo - Centralizado */}
            <Link to="/" className="flex-shrink-0 mx-auto lg:mx-0">
              <motion.h1
                whileHover={{ scale: 1.05 }}
                className="text-2xl md:text-3xl font-heading font-bold gradient-text"
              >
                Leiasabores
              </motion.h1>
            </Link>

            {/* Search Bar - Desktop - Centralizado */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex flex-1 max-w-xl mx-8"
            >
              <div ref={searchRef} className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Buscar produtos..."
                  className="input pl-12 w-full bg-white/50 backdrop-blur-sm border-border/50 focus:bg-white focus:border-primary"
                />
                
                {/* Loading indicator */}
                {isSearching && searchQuery.length >= 2 && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                )}
                
                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="p-2">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].image_url}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                <Search className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.title}</p>
                              {product.short_description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.short_description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                        <button
                          onClick={handleSearch}
                          className="w-full mt-2 p-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          Ver todos os resultados para "{searchQuery}"
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

            {/* Actions - Direita */}
            <div className="flex items-center gap-2">
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
                {favoritesCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-md px-1"
                  >
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </motion.span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="btn btn-ghost p-2 relative"
                aria-label="Carrinho"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-md px-1"
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </motion.span>
                )}
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

          {/* Navigation Menu - Desktop - Centralizado */}
          <nav className="hidden lg:flex items-center justify-center gap-8 py-4 border-t border-border/50">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Produtos' },
              { to: '/categories', label: 'Categorias' },
              { to: '/collections', label: 'Coleções' },
              { to: '/blog', label: 'Blog' },
              { to: '/about', label: 'Sobre' },
              { to: '/contact', label: 'Contato' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-semibold hover:text-primary transition-colors relative group px-2 py-1"
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
              <div ref={searchRef} className="relative">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        if (searchQuery.length >= 2) {
                          setShowSuggestions(true);
                        }
                      }}
                      placeholder="Buscar produtos..."
                      className="input pl-10 flex-1"
                      autoFocus
                    />
                    {isSearching && searchQuery.length >= 2 && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                </form>
                
                {/* Mobile Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="p-2">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].image_url}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                <Search className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.title}</p>
                              {product.short_description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.short_description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                        <button
                          onClick={handleSearch}
                          className="w-full mt-2 p-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          Ver todos os resultados para "{searchQuery}"
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
