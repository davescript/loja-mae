import { Play } from 'lucide-react';

export default function HighlightSection() {
  return (
    <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="rounded-[var(--radius)] overflow-hidden shadow-elevated relative">
        <img
          src="https://images.unsplash.com/photo-1618227440618-73a7b66d5f63?q=80&w=1600&auto=format&fit=crop"
          alt="Ambiente interior com luz quente"
          className="w-full h-[360px] md:h-[520px] object-cover"
        />
        <button
          className="absolute inset-0 m-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 text-primary shadow-elevated flex items-center justify-center hover:bg-white transition"
          aria-label="Play vídeo"
        >
          <Play className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
}

