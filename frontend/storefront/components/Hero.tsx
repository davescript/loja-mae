import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Hero() {
  // Imagem cinematográfica de bolo (estética quente e natural)
  const imageUrl =
    'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8';

  return (
    <section className="relative overflow-hidden rounded-2xl md:rounded-[var(--radius)] shadow-elevated bg-card">
      <div className="absolute inset-0">
        <img src={imageUrl} alt="Bolo cinematográfico com luz natural" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>

      <div className="relative container mx-auto px-6 md:px-8 py-24 md:py-40">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-heading text-white drop-shadow-lg max-w-3xl"
        >
          Bringing Simplicity to Modern Living
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 md:mt-6 text-white/90 max-w-2xl text-lg"
        >
          Peças com estética de interiores e lifestyle contemporâneo. Materiais naturais, tons quentes e design atemporal.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Link to="/collections" className="px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-soft hover:shadow-elevated transition">
            Explorar Coleções
          </Link>
          <Link to="/products" className="px-6 py-3 rounded-full bg-white/90 text-primary shadow-soft hover:bg-white transition">
            Ver Produtos
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

