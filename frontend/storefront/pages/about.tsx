import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="rounded-[var(--radius)] overflow-hidden shadow-soft">
          <img
            src="https://api.leiasabores.pt/api/images/products/toppers/topper-nome-dourado.jpeg"
            alt="Bolo decorado com topo personalizado Leiasabores"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading">Sobre a Leiasabores</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A Leiasabores nasceu do gosto por bolos bonitos e festas memoráveis. Criamos topos de bolo
            personalizados e reunimos produtos de confeitaria para quem quer dar um toque especial a cada celebração.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            De aniversários infantis a casamentos, cada peça é pensada ao detalhe. Se não encontrar o tema que
            procura, fale connosco — fazemos por medida.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90"
            >
              Ver produtos
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 font-medium hover:border-primary"
            >
              Fale connosco
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
