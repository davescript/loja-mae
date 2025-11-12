import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { motion } from 'framer-motion';
import { Search, Grid, List, Filter, ChevronRight, Package, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { Category } from '@shared/types';

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Category[] }>('/api/categories?status=active');
        return response.data?.items || [];
      } catch (error) {
        console.error('Error loading categories:', error);
        return [];
      }
    },
    retry: 1,
  });

  const filteredCategories = categories?.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const categoryColors = [
    { gradient: 'from-rose-500 via-pink-500 to-rose-600', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { gradient: 'from-amber-500 via-yellow-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { gradient: 'from-purple-500 via-indigo-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { gradient: 'from-emerald-500 via-teal-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { gradient: 'from-blue-500 via-cyan-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { gradient: 'from-violet-500 via-purple-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { gradient: 'from-orange-500 via-red-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { gradient: 'from-green-500 via-emerald-500 to-green-600', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  ];

  const getCategoryColor = (index: number) => {
    return categoryColors[index % categoryColors.length];
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 py-16 md:py-24 mb-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4">
              Nossas Categorias
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Explore nossa seleção completa de produtos organizados por categoria
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar categorias..."
                  className="input pl-12 w-full bg-white/80 backdrop-blur-sm border-2 focus:border-primary"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Controls Bar */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
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

      {/* Categories Grid/List */}
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Tente buscar com outros termos' : 'Nenhuma categoria disponível no momento'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => {
              const color = getCategoryColor(index);
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Link
                    to={`/products?category_id=${category.id}`}
                    className="block group relative overflow-hidden rounded-2xl bg-white border-2 border-border/50 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-2xl h-full"
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    {/* Content */}
                    <div className="relative p-6 md:p-8 flex flex-col h-full">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl ${color.bg} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}
                      >
                        <Package className={`w-8 h-8 md:w-10 md:h-10 ${color.text}`} />
                      </motion.div>
                      
                      {/* Title */}
                      <h3 className="font-bold text-lg md:text-xl text-center mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      
                      {/* Description */}
                      {category.description && (
                        <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2 flex-1">
                          {category.description}
                        </p>
                      )}
                      
                      {/* CTA */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="mt-auto flex items-center justify-center gap-2 text-primary font-semibold text-sm"
                      >
                        <span>Explorar</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    </div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category, index) => {
              const color = getCategoryColor(index);
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ x: 4 }}
                >
                  <Link
                    to={`/products?category_id=${category.id}`}
                    className="block group glass-card p-6 md:p-8 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-6">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${color.bg} flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        <Package className={`w-8 h-8 md:w-10 md:h-10 ${color.text}`} />
                      </motion.div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex-shrink-0 text-primary"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State Illustration */}
      {!isLoading && filteredCategories.length === 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="container mx-auto px-4 mt-12"
        >
          <div className="card p-12 text-center max-w-md mx-auto">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Não encontramos categorias com "{searchQuery}". Tente buscar com outros termos.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-primary"
            >
              Limpar busca
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
