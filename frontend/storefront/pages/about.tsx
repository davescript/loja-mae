export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="rounded-[var(--radius)] overflow-hidden shadow-soft">
          <img
            src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format&fit=crop"
            alt="Estúdio com mobiliário em madeira"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading">Sobre a Leiasabores</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Inspirados pela estética de interiores e lifestyle moderno, criamos coleções que evocam luxo discreto e conforto visual. Nossa missão é simplificar sua experiência de compra, oferecendo peças de qualidade superior com acabamentos impecáveis.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="rounded-xl bg-secondary p-6 shadow-soft">
              <p className="text-primary font-heading text-2xl">150+</p>
              <p className="text-sm text-muted-foreground">Fornecedores de móveis</p>
            </div>
            <div className="rounded-xl bg-secondary p-6 shadow-soft">
              <p className="text-primary font-heading text-2xl">15+</p>
              <p className="text-sm text-muted-foreground">Anos de mercado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
