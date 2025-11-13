import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import type { Product, Category } from '@shared/types';
import ProductCard from '../components/app/ProductCard';
import QuickViewModal from '../components/app/QuickViewModal';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id');
  const categorySlug = searchParams.get('category');

  // Fetch products
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', page, search, categoryId, categorySlug],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '20',
          status: 'active',
        });
        
        if (search) params.append('search', search);
        if (categoryId) params.append('category_id', categoryId);
        if (categorySlug) params.append('category', categorySlug);
        
        // Always include images in product list
        params.append('include', 'images');

        const response = await apiRequest<{ items: Product[]; total: number }>(
          `/api/products?${params.toString()}`
        );
        return response.data || { items: [], total: 0 };
      } catch (error) {
        console.error('Error loading products:', error);
        return { items: [], total: 0 };
      }
    },
    retry: 1,
    staleTime: 0, // Sempre buscar dados atualizados do servidor
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Category[] }>('/api/categories?status=active');
        return response.data?.items || [];
      } catch (error) {
        return [];
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      newParams.set('search', localSearch.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleAddToCart = (product: Product) => {
    // Esta função é chamada pelo ProductCard quando o item é adicionado
    // O ProductCard já implementa a lógica de adicionar ao carrinho via useCartStore
  };

  const totalPages = productsData?.total ? Math.ceil(productsData.total / 20) : 1;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section - Compacto */}
      <section className="relative py-6 md:py-8 mb-6">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-heading font-bold mb-2">
                Nossos Produtos
              </h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Descubra nossa seleção completa de acessórios premium
              </p>
            </div>
            
            {/* Search Bar - Compacta */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="input pl-10 pr-10 py-2 text-sm bg-white/80 backdrop-blur-sm border focus:border-primary"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('search');
                      setSearchParams(newParams);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Controls Bar */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="btn btn-muted flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <span className="text-sm text-muted-foreground">
              {productsData?.total || 0} {productsData?.total === 1 ? 'produto' : 'produtos'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              aria-label="Visualização em grade"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              aria-label="Visualização em lista"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          height: filtersOpen ? 'auto' : 0,
          opacity: filtersOpen ? 1 : 0
        }}
        className="container mx-auto px-4 mb-6 overflow-hidden"
      >
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Categoria</label>
              <select
                value={categoryId || ''}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    newParams.set('category_id', e.target.value);
                  } else {
                    newParams.delete('category_id');
                  }
                  newParams.delete('category');
                  newParams.set('page', '1');
                  setSearchParams(newParams);
                }}
                className="input w-full"
              >
                <option value="">Todas as categorias</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Ordenar por</label>
              <select
                value={searchParams.get('sortBy') || 'created_at'}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('sortBy', e.target.value);
                  newParams.set('page', '1');
                  setSearchParams(newParams);
                }}
                className="input w-full"
              >
                <option value="created_at">Mais recentes</option>
                <option value="title">Nome A-Z</option>
                <option value="price_cents">Menor preço</option>
                <option value="price_cents_desc">Maior preço</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchParams({});
                  setLocalSearch('');
                }}
                className="btn btn-ghost w-full"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Products Grid/List */}
      <div className="container mx-auto px-4">
        {loadingProducts ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-96 animate-pulse" />
            ))}
          </div>
        ) : productsData?.items && productsData.items.length > 0 ? (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {productsData.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(prod) => {
                    setSelectedProduct(prod);
                    setQuickOpen(true);
                    // Scroll to top to ensure modal is visible
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', Math.max(1, page - 1).toString());
                    setSearchParams(newParams);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="btn btn-muted disabled:opacity-50"
                >
                  Anterior
                </button>
                
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('page', pageNum.toString());
                          setSearchParams(newParams);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', Math.min(totalPages, page + 1).toString());
                    setSearchParams(newParams);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === totalPages}
                  className="btn btn-muted disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {search ? 'Tente buscar com outros termos ou limpe os filtros' : 'Nenhum produto disponível no momento'}
            </p>
            {search && (
              <button
                onClick={() => {
                  setSearchParams({});
                  setLocalSearch('');
                }}
                className="btn btn-primary"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>

      <QuickViewModal 
        open={quickOpen} 
        onOpenChange={setQuickOpen} 
        product={selectedProduct} 
      />
    </div>
  );
}
