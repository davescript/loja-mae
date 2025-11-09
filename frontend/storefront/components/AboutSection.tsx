import { motion } from 'framer-motion';
import { Leaf, Box, Ruler } from 'lucide-react';

export default function AboutSection() {
  return (
    <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-[var(--radius)] overflow-hidden shadow-soft"
        >
          <img
            src="https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1600&auto=format&fit=crop"
            alt="Interior design com tons quentes"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div>
          <h2 className="text-3xl md:text-4xl font-heading">Who We Are</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
            Criamos experiências de luxo moderno com foco em materiais naturais, conforto visual e simplicidade elegante. Nossa curadoria combina estética arquitetural com design funcional.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Leaf, label: 'Materiais Naturais' },
              { icon: Box, label: 'Design Premium' },
              { icon: Ruler, label: 'Acabamento Preciso' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl bg-secondary p-6 text-center shadow-soft">
                <Icon className="w-6 h-6 mx-auto text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
