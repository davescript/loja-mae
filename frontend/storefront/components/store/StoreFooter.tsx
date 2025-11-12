import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function StoreFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-heading text-lg font-semibold mb-4">
              Loja Mãe
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Sua loja especializada em acessórios premium para confeitaria, bolos e eventos.
              Qualidade e elegância em cada produto.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center transition"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-heading text-lg font-semibold mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm hover:text-primary transition">
                  Produtos
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-primary transition">
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-primary transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-primary transition">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-heading text-lg font-semibold mb-4">
              Atendimento
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/account" className="text-sm hover:text-primary transition">
                  Minha Conta
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm hover:text-primary transition">
                  Meus Pedidos
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-sm hover:text-primary transition">
                  Favoritos
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm hover:text-primary transition">
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-heading text-lg font-semibold mb-4">
              Contato
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  Rua Exemplo, 123<br />
                  Lisboa, Portugal
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+351912345678" className="text-sm hover:text-primary transition">
                  +351 912 345 678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:contato@lojama.com" className="text-sm hover:text-primary transition">
                  contato@lojama.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Loja Mãe. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-primary transition">
              Privacidade
            </Link>
            <Link to="/terms" className="hover:text-primary transition">
              Termos
            </Link>
            <Link to="/shipping" className="hover:text-primary transition">
              Envios
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
