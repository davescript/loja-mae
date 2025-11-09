import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Maria Angelica',
    role: 'Arquiteta de Interiores',
    quote:
      'A estética e o conforto das peças elevaram nossos projetos. A paleta quente traz uma calma visual rara.',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'João Pereira',
    role: 'Designer',
    quote:
      'Qualidade premium com simplicidade elegante. O acabamento é impecável em cada detalhe.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <h2 className="text-3xl md:text-4xl font-heading mb-10">Testemunhos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testimonials.map((t, idx) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="rounded-2xl bg-card p-6 shadow-soft"
          >
            <div className="flex items-center gap-4">
              <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">“{t.quote}”</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

