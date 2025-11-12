import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 1,
    title: 'Acessórios Premium para Bolos',
    subtitle: 'Tudo o que você precisa para criar bolos incríveis',
    description: 'Formas, toppers, decorações e muito mais com qualidade premium',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop',
    buttonText: 'Explorar Produtos',
    buttonLink: '/products',
    bgColor: 'from-primary/20 via-secondary/30 to-accent/20',
  },
  {
    id: 2,
    title: 'Toppers Personalizados',
    subtitle: 'Dê um toque especial ao seu bolo',
    description: 'Toppers únicos e personalizados para tornar seu evento inesquecível',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=1600&auto=format&fit=crop',
    buttonText: 'Ver Toppers',
    buttonLink: '/products?category=toppers',
    bgColor: 'from-accent/20 via-primary/30 to-secondary/20',
  },
  {
    id: 3,
    title: 'Embalagens Elegantes',
    subtitle: 'Apresente seus produtos com estilo',
    description: 'Caixas, sacolas e embalagens premium para seus eventos',
    image: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1600&auto=format&fit=crop',
    buttonText: 'Ver Embalagens',
    buttonLink: '/products?category=embalagens',
    bgColor: 'from-secondary/20 via-accent/30 to-primary/20',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-2xl md:rounded-[var(--radius)] shadow-elevated">
      <AnimatePresence mode="wait">
        {slides.map(
          (slide, index) =>
            index === currentSlide && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative h-full flex items-center">
                  <div className="container mx-auto px-6 md:px-8">
                    <div className="max-w-2xl">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-white/90 text-sm md:text-base mb-2 font-medium">
                          {slide.subtitle}
                        </p>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed">
                          {slide.description}
                        </p>
                        <Link
                          to={slide.buttonLink}
                          className="btn btn-primary text-base px-8 py-4 inline-flex items-center gap-2"
                        >
                          {slide.buttonText}
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
        )}
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center transition-all shadow-lg z-10"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center transition-all shadow-lg z-10"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
