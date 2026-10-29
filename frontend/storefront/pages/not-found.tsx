import { Link } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';

export default function NotFoundPage() {
  useSEO({ title: 'Página não encontrada' });

  return (
    <div className="container mx-auto px-4 md:px-8 py-24 text-center">
      <p className="text-6xl font-heading text-primary">404</p>
      <h1 className="mt-4 text-2xl md:text-3xl font-heading">Página não encontrada</h1>
      <p className="mt-3 text-muted-foreground">
        O endereço que procura não existe ou foi alterado.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90"
        >
          Voltar ao início
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center rounded-full border border-border px-6 py-3 font-medium hover:border-primary"
        >
          Ver produtos
        </Link>
      </div>
    </div>
  );
}
