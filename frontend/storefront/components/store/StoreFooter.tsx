import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function StoreFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12 sm:mt-20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-heading text-lg font-semibold mb-3 sm:mb-4">
              Leiasabores
            </h3>
            <p className="text-sm leading-relaxed mb-4 hidden sm:block">
              Sua loja especializada em acessórios premium para confeitaria, bolos e eventos.
              Qualidade e elegância em cada produto.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/leiasabores"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/leiasabores/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:davecdl@outlook.com"
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
                <a href="tel:+351969407406" className="text-sm hover:text-primary transition">
                  +351 969 407 406
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:davecdl@outlook.com" className="text-sm hover:text-primary transition">
                  davecdl@outlook.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment methods */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">Métodos de pagamento aceites:</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Visa */}
              <span className="bg-white text-[#1A1F71] font-black text-xs px-3 py-1 rounded font-sans tracking-wide">VISA</span>
              {/* Mastercard */}
              <span className="bg-[#EB001B] text-white font-bold text-xs px-2 py-1 rounded">MC</span>
              {/* MB Way */}
              <span className="bg-white text-[#005faa] font-bold text-xs px-2 py-1 rounded">MB WAY</span>
              {/* Klarna */}
              <span className="bg-[#FFB3C7] text-[#17120f] font-black text-xs px-3 py-1 rounded italic">Klarna</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Leiasabores. Todos os direitos reservados.
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Lisboa, Portugal · davecdl@outlook.com
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm justify-center">
            <Link to="/privacy" className="hover:text-primary transition">
              Privacidade
            </Link>
            <Link to="/terms" className="hover:text-primary transition">
              Termos
            </Link>
            <Link to="/returns" className="hover:text-primary transition">
              Devoluções
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
