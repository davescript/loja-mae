import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Product } from '@shared/types';
import Carousel from '../components/app/Carousel';
import ProductCard from '../components/app/ProductCard';
import CategoriesModal from '../components/app/CategoriesModal';
import QuickViewModal from '../components/app/QuickViewModal';
import KpiWidgets from '../components/app/KpiWidgets';
import HeroSlider from '../components/store/HeroSlider';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Star, Truck, Shield } from 'lucide-react';

export default function HomePage() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['products', 'best'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Product[] }>(
          '/api/products?status=active&pageSize=10&featured=1'
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
          '/api/products?status=active&pageSize=10'
        );
        return response.data?.items || [];
      } catch (error) {
        console.error('Error loading essentials:', error);
        return [];
      }
    },
    retry: 1,
  });

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
    <div className="space-y-16 md:space-y-24">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Features Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="card p-6 text-center"
          >
            <feature.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Categories Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Categorias</h2>
          <Link to="/categories" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Formas', emoji: '🍰', slug: 'formas' },
            { label: 'Toppers', emoji: '✨', slug: 'toppers' },
            { label: 'Confeitaria', emoji: '🧁', slug: 'confeitaria' },
            { label: 'Caixas', emoji: '🎁', slug: 'caixas' },
            { label: 'Balões', emoji: '🎈', slug: 'baloes' },
          ].map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${c.slug}`}
              className="card p-6 text-center hover:shadow-elevated transition-all group"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                {c.emoji}
              </div>
              <p className="font-medium">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Mais Vendidos */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Mais Vendidos</h2>
          <Link to="/products?featured=1" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {loadingBest ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card h-80 animate-pulse" />
            ))}
          </div>
        ) : bestSellers && bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bestSellers.slice(0, 5).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => {
                  setSelectedProduct(prod);
                  setQuickOpen(true);
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Acessórios Essenciais</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {loadingEss ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card h-80 animate-pulse" />
            ))}
          </div>
        ) : essentials && essentials.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {essentials.slice(0, 5).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => {
                  setSelectedProduct(prod);
                  setQuickOpen(true);
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

      {/* Depoimentos */}
      <section>
        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6 text-center">
          O que nossos clientes dizem
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div className="text-sm font-semibold">— {t.name}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="card p-8 md:p-12 bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 text-center">
        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
          Receba nossas novidades
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Cadastre-se e receba ofertas exclusivas, lançamentos e dicas de decoração
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Inscrição realizada com sucesso!');
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder="Seu melhor email"
            className="input flex-1"
            required
          />
          <button type="submit" className="btn btn-primary whitespace-nowrap">
            Inscrever-se
          </button>
        </form>
      </section>

      <CategoriesModal open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <QuickViewModal open={quickOpen} onOpenChange={setQuickOpen} product={selectedProduct} />
    </div>
  );
}
