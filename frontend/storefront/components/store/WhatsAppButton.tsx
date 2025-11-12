import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsAppButton() {
  const phoneNumber = '351969407406'; // Número sem espaços ou caracteres especiais
  const whatsappUrl = `https://wa.me/${phoneNumber}`;
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os produtos.');

  return (
    <motion.a
      href={`${whatsappUrl}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Fale conosco no WhatsApp"
    >
      {/* Botão Principal */}
      <div className="relative">
        {/* Efeito de pulso */}
        <motion.div
          className="absolute inset-0 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Botão */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-green-500/50 transition-all duration-300">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-lg">
              Fale conosco no WhatsApp
              <div className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-1">
                <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

