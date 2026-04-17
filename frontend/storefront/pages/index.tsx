import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Product } from '@shared/types';
import Carousel from '../components/app/Carousel';
import ProductCard from '../components/app/ProductCard';
import CategoriesModal from '../components/app/CategoriesModal';
import QuickViewModal from '../components/app/QuickViewModal';
import KpiWidgets from '../components/app/KpiWidgets';
import HeroSlider from '../components/store/HeroSlider';
import BannerDisplay from '../components/app/BannerDisplay';
import NewsletterForm from '../components/app/NewsletterForm';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Star, Truck, Shield } from 'lucide-react';
import { useBanners } from '../../hooks/useBanners';
import { useSEO } from '../../hooks/useSEO';
import { generateHomeSEO } from '../../utils/seo';

export default function HomePage() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  // SEO
  useSEO(generateHomeSEO());

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['products', 'best'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Product[] }>(
          '/api/products?status=active&pageSize=10&featured=1&include=images'
        );
        return response.data?.items || [];
      } catch (error) {
        console.error('Error loading best sellers:', error);
        return [];
      }
    },
    retry: 1,
  });

  const { data: essentials, isLoading: loadingEss } = useQuery({
    queryKey: ['products', 'essentials'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Product[] }>(
          '/api/products?status=active&pageSize=10&include=images'
        );
        return response.data?.items || [];
      } catch (error) {
        console.error('Error loading essentials:', error);
        return [];
      }
    },
    retry: 1,
  });

  const { data: heroBanners } = useBanners('home_hero', 1);
  const hasHeroBanner = heroBanners && heroBanners.length > 0;

  const features = [
    {
      icon: Package,
      title: 'Produtos Premium',
      description: 'Qualidade garantida em todos os produtos',
    },
    {
      icon: Truck,
      title: 'Entrega Rápida',
      description: 'Receba seus pedidos em até 48h',
    },
    {
      icon: Shield,
      title: 'Compra Segura',
      description: 'Pagamento 100% seguro e protegido',
    },
    {
      icon: Star,
      title: 'Atendimento',
      description: 'Suporte dedicado para você',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-24 pb-16 sm:pb-20">
      {/* Hero Banner / Slider */}
      {hasHeroBanner ? (
        <BannerDisplay position="home_hero" className="mb-12" />
      ) : (
        <HeroSlider />
      )}

      {/* Top Banners */}
      <BannerDisplay position="home_top" className="mt-4" variant="grid" limit={3} />

      {/* Categories Quick Access - Design Aprimorado */}
      <section className="py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold mb-1 sm:mb-2">Nossas Categorias</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">Explore nossa seleção especial</p>
          </div>
          <Link
            to="/categories"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 sm:gap-2 group whitespace-nowrap"
          >
            Ver todas
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-block"
            >
              →
            </motion.span>
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {[
            {
              label: 'Formas',
              emoji: '🍰',
              slug: 'formas',
              gradient: 'from-rose-200 via-pink-200 to-rose-300',
              hoverGradient: 'from-rose-300 via-pink-300 to-rose-400',
              iconBg: 'bg-rose-100'
            },
            {
              label: 'Toppers',
              emoji: '✨',
              slug: 'toppers',
              gradient: 'from-amber-200 via-yellow-200 to-amber-300',
              hoverGradient: 'from-amber-300 via-yellow-300 to-amber-400',
              iconBg: 'bg-amber-100'
            },
            {
              label: 'Confeitaria',
              emoji: '🧁',
              slug: 'confeitaria',
              gradient: 'from-purple-200 via-indigo-200 to-purple-300',
              hoverGradient: 'from-purple-300 via-indigo-300 to-purple-400',
              iconBg: 'bg-purple-100'
            },
            {
              label: 'Caixas',
              emoji: '🎁',
              slug: 'caixas',
              gradient: 'from-emerald-200 via-teal-200 to-emerald-300',
              hoverGradient: 'from-emerald-300 via-teal-300 to-emerald-400',
              iconBg: 'bg-emerald-100'
            },
            {
              label: 'Balões',
              emoji: '🎈',
              slug: 'baloes',
              gradient: 'from-blue-200 via-cyan-200 to-blue-300',
              hoverGradient: 'from-blue-300 via-cyan-300 to-blue-400',
              iconBg: 'bg-blue-100'
            },
          ].map((c, index) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -12, scale: 1.05 }}
              className="group"
            >
              <Link
                to={`/products?category=${c.slug}`}
                className="block relative overflow-hidden rounded-2xl bg-white border-2 border-border/50 hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-2xl"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>

                {/* Content */}
                <div className="relative p-3 sm:p-5 md:p-8 text-center">
                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-xl sm:rounded-2xl ${c.iconBg} flex items-center justify-center shadow-md group-hover:shadow-xl transition-all`}
                  >
                    <span className="text-2xl sm:text-3xl md:text-4xl">{c.emoji}</span>
                  </motion.div>

                  {/* Label */}
                  <h3 className="font-bold text-xs sm:text-sm md:text-base text-foreground group-hover:text-primary transition-colors leading-tight">
                    {c.label}
                  </h3>

                  {/* Hover Arrow - hidden on mobile */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="hidden sm:flex mt-2 text-primary text-xs font-medium items-center justify-center gap-1"
                  >
                    Explorar
                    <span>→</span>
                  </motion.div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Bar - Moderno */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="glass-card p-4 sm:p-5 md:p-8 text-center group cursor-pointer"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all"
            >
              <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
            </motion.div>
            <h3 className="font-bold mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">{feature.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed hidden sm:block">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Mais Vendidos */}
      <section>
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-heading font-bold">Mais Vendidos</h2>
          <Link
            to="/products?featured=1"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Ver todos
            <span>→</span>
          </Link>
        </div>
        {loadingBest ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card h-64 sm:h-80 animate-pulse" />
            ))}
          </div>
        ) : bestSellers && bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {bestSellers.slice(0, 5).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => {
                  setSelectedProduct(prod);
                  setQuickOpen(true);
                  // Scroll to top to ensure modal is visible
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-muted-foreground">Nenhum produto em destaque no momento.</p>
          </div>
        )}
      </section>

      {/* Acessórios Essenciais */}
      <section>
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-heading font-bold">Acessórios Essenciais</h2>
          <Link
            to="/products"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Ver todos
            <span>→</span>
          </Link>
        </div>
        {loadingEss ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card h-64 sm:h-80 animate-pulse" />
            ))}
          </div>
        ) : essentials && essentials.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {essentials.slice(0, 5).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => {
                  setSelectedProduct(prod);
                  setQuickOpen(true);
                  // Scroll to top to ensure modal is visible
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </section>

      {/* Depoimentos - Moderno */}
      <section>
        <h2 className="text-xl sm:text-2xl font-heading font-bold mb-5 sm:mb-8 text-center">
          O que nossos clientes dizem
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {[
            {
              name: 'Carla Silva',
              text: 'Produtos lindos e entrega super rápida! Meus bolos ficaram ainda mais elegantes. Recomendo muito!',
              rating: 5,
            },
            {
              name: 'Rui Santos',
              text: 'Qualidade excelente, adorei os toppers e as embalagens. Voltarei a comprar com certeza.',
              rating: 5,
            },
            {
              name: 'Mariana Costa',
              text: 'Atendimento impecável e acessórios com acabamento premium. Super recomendo a loja!',
              rating: 5,
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-6 md:p-8"
            >
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed text-sm">"{t.text}"</p>
              <div className="text-sm font-bold text-foreground">— {t.name}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Banners */}
      <BannerDisplay position="home_bottom" className="mt-4" variant="grid" limit={3} />

      {/* Newsletter CTA - Moderno */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20"></div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <NewsletterForm />
      </section>

      <CategoriesModal open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <QuickViewModal open={quickOpen} onOpenChange={setQuickOpen} product={selectedProduct} />
    </div>
  );
}
