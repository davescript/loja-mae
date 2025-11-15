import { motion } from 'framer-motion';
import { Truck, Package, MapPin, Clock, Euro, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function ShippingPage() {
  const shippingMethods = [
    {
      name: 'Entrega Standard',
      icon: Package,
      price: '€4,90',
      time: '3-5 dias úteis',
      description: 'Entrega através dos CTT para todo o território português.',
      features: ['Rastreamento incluído', 'Seguro até €50', 'Entrega em casa'],
    },
    {
      name: 'Entrega Express',
      icon: Truck,
      price: '€9,90',
      time: '1-2 dias úteis',
      description: 'Entrega prioritária para receber o seu pedido mais rapidamente.',
      features: ['Rastreamento em tempo real', 'Seguro até €100', 'Entrega prioritária', 'Notificações SMS'],
    },
    {
      name: 'Entrega no Dia',
      icon: Clock,
      price: '€14,90',
      time: 'No mesmo dia',
      description: 'Disponível apenas no Algarve. Pedidos até 13h.',
      features: ['Entrega no mesmo dia', 'Rastreamento em tempo real', 'Seguro completo', 'Notificações SMS'],
    },
  ];

  const zones = [
    {
      name: 'Portugal Continental',
      icon: MapPin,
      methods: ['Todas as opções disponíveis'],
      time: '1-5 dias úteis',
    },
    {
      name: 'Ilhas (Açores e Madeira)',
      icon: MapPin,
      methods: ['Entrega Standard', 'Entrega Express'],
      time: '5-7 dias úteis',
    },
    {
      name: 'Espanha',
      icon: MapPin,
      methods: ['Entrega Internacional Standard'],
      time: '7-10 dias úteis',
      price: '€12,90',
    },
  ];

  const faqs = [
    {
      question: 'Como posso rastrear o meu pedido?',
      answer: 'Após o envio, receberá um e-mail com o número de rastreamento. Pode acompanhar o seu pedido através do link fornecido ou no seu painel de cliente.',
    },
    {
      question: 'O que acontece se não estiver em casa?',
      answer: 'O estafeta tentará entregar o pedido. Se não conseguir, deixará um aviso e poderá reagendar a entrega ou recolher no posto CTT mais próximo.',
    },
    {
      question: 'Posso alterar o endereço de entrega após fazer o pedido?',
      answer: 'Sim, pode alterar o endereço até 24h após a confirmação do pedido. Contacte-nos através do e-mail ou telefone.',
    },
    {
      question: 'Os produtos são enviados em embalagens seguras?',
      answer: 'Sim, todos os produtos são cuidadosamente embalados para garantir que chegam em perfeitas condições. Utilizamos materiais de proteção adequados.',
    },
    {
      question: 'Há custos adicionais para envios internacionais?',
      answer: 'Para envios para fora de Portugal, podem aplicar-se taxas alfandegárias que são da responsabilidade do cliente. Informamos sempre antes do envio.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Informações de Envio
            </h1>
            <p className="text-lg text-muted-foreground">
              Oferecemos várias opções de entrega para que receba os seus produtos da forma mais conveniente e rápida possível.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shipping Methods */}
      <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-heading font-bold mb-4">Métodos de Envio</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha a opção que melhor se adequa às suas necessidades. Todos os envios incluem seguro e rastreamento.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {shippingMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-bold text-primary">{method.price}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{method.time}</span>
                  </div>
                  <ul className="space-y-2">
                    {method.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shipping Zones */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-heading font-bold mb-4">Zonas de Entrega</h2>
              <p className="text-muted-foreground">
                Entregamos em todo o território português e também em Espanha.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {zones.map((zone, index) => {
                const Icon = zone.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                    className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-heading font-bold">{zone.name}</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Métodos disponíveis:</p>
                        <div className="space-y-1">
                          {zone.methods.map((method, methodIndex) => (
                            <p key={methodIndex} className="text-sm text-muted-foreground">
                              {method}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Prazo: {zone.time}</span>
                      </div>
                      {zone.price && (
                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Custo: {zone.price}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Important Information */}
      <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-heading font-bold mb-4">Informações Importantes</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-heading font-bold mb-3 text-blue-900">
                  Processamento e Envio
                </h3>
                <div className="space-y-2 text-blue-800">
                  <p>Os pedidos são processados em 1-2 dias úteis após a confirmação do pagamento.</p>
                  <p>Em caso de produtos personalizados, o prazo de processamento pode ser estendido.</p>
                  <p>Receberá um e-mail de confirmação quando o pedido for enviado.</p>
                  <p>Os prazos de entrega começam a contar após o envio, não após a compra.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-heading font-bold mb-3 text-green-900">
                  Segurança e Proteção
                </h3>
                <div className="space-y-2 text-green-800">
                  <p>Todos os envios incluem seguro contra perda e danos.</p>
                  <p>Em caso de produto danificado durante o transporte, substituímos gratuitamente.</p>
                  <p>Verifique sempre o estado da embalagem antes de assinar o recibo.</p>
                  <p>Se notar algum dano, recuse a entrega e contacte-nos imediatamente.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-heading font-bold mb-4">Perguntas Frequentes</h2>
              <p className="text-muted-foreground">
                Respostas às questões mais comuns sobre envios e entregas.
              </p>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                  className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm"
                >
                  <h3 className="text-lg font-heading font-bold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 md:p-10 text-center"
          >
            <h2 className="text-2xl font-heading font-bold mb-4">
              Precisa de Ajuda com o Envio?
            </h2>
            <p className="text-muted-foreground mb-6">
              A nossa equipa está disponível para esclarecer qualquer dúvida sobre envios e entregas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:davecdl@outlook.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Package className="w-5 h-5" />
                davecdl@outlook.com
              </a>
              <a
                href="tel:+351969407406"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-border text-foreground font-medium hover:bg-gray-50 transition-colors"
              >
                <Truck className="w-5 h-5" />
                +351 969 407 406
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

