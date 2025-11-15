import { motion } from 'framer-motion';
import { FileText, ShoppingCart, CreditCard, RotateCcw, CheckCircle } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      icon: FileText,
      title: '1. Aceitação dos Termos',
      content: [
        'Ao aceder e utilizar o website da Leiasabores, aceita estar vinculado a estes Termos e Condições de Utilização.',
        'Se não concordar com algum destes termos, não deve utilizar o nosso website.',
        'Reservamo-nos o direito de modificar estes termos a qualquer momento, sendo as alterações publicadas nesta página.',
        'É sua responsabilidade verificar periodicamente estas condições para estar ciente de quaisquer alterações.',
      ],
    },
    {
      icon: ShoppingCart,
      title: '2. Produtos e Preços',
      content: [
        'Todos os produtos são apresentados com a maior precisão possível, incluindo descrições, imagens e preços.',
        'Reservamo-nos o direito de corrigir erros de preços, mesmo após a confirmação do pedido.',
        'Os preços incluem IVA à taxa legal aplicável em Portugal.',
        'Os produtos estão sujeitos à disponibilidade de stock. Em caso de indisponibilidade, contactaremos o cliente.',
        'Reservamo-nos o direito de recusar ou cancelar qualquer pedido por qualquer motivo.',
      ],
    },
    {
      icon: CreditCard,
      title: '3. Pagamentos',
      content: [
        'Aceitamos pagamentos através de cartão de crédito/débito, MB Way e transferência bancária.',
        'Todos os pagamentos são processados de forma segura através de gateways de pagamento certificados.',
        'O pagamento é processado no momento da confirmação do pedido.',
        'Em caso de pagamento por transferência bancária, o pedido será processado após confirmação do pagamento.',
        'Reservamo-nos o direito de solicitar informações adicionais para verificar a identidade do cliente.',
      ],
    },
    {
      icon: CheckCircle,
      title: '4. Envio e Entrega',
      content: [
        'Os produtos são enviados para o endereço indicado durante o processo de checkout.',
        'Os prazos de entrega são estimativas e podem variar consoante a disponibilidade e o método de envio escolhido.',
        'Não nos responsabilizamos por atrasos causados por fatores fora do nosso controlo (ex: greves, condições climáticas).',
        'O cliente é responsável por fornecer um endereço de entrega correto e completo.',
        'Em caso de falha na entrega devido a endereço incorreto, podem ser aplicadas taxas adicionais para reenvio.',
      ],
    },
    {
      icon: RotateCcw,
      title: '5. Direito de Devolução e Reembolso',
      content: [
        'Os produtos devem ser devolvidos nas mesmas condições em que foram recebidos, com etiquetas e embalagens originais.',
        'Os custos de devolução são da responsabilidade do cliente, exceto em caso de produto defeituoso ou incorreto.',
        'O reembolso será processado no prazo de 14 dias após receção e verificação do produto devolvido.',
        'O reembolso será efetuado através do mesmo método de pagamento utilizado na compra.',
        'Produtos personalizados ou feitos sob medida não podem ser devolvidos, exceto em caso de defeito.',
      ],
    },
    {
      icon: FileText,
      title: '6. Contas de Utilizador',
      content: [
        'É responsável por manter a confidencialidade das suas credenciais de acesso.',
        'Deve notificar-nos imediatamente em caso de uso não autorizado da sua conta.',
        'Não nos responsabilizamos por perdas resultantes do uso não autorizado da sua conta.',
        'Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.',
      ],
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Termos e Condições
            </h1>
            <p className="text-lg text-muted-foreground">
              Por favor, leia cuidadosamente estes termos antes de utilizar os nossos serviços. 
              Ao fazer uma compra, concorda com todas as condições aqui estabelecidas.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Última atualização: {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="prose prose-lg max-w-none"
          >
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos e Condições regem a utilização do website da <strong>Leiasabores</strong> e a compra de produtos 
              através da nossa plataforma online. Ao aceder ao nosso website e efetuar uma compra, concorda em cumprir 
              e estar vinculado a estes termos. Recomendamos que leia atentamente todas as secções antes de realizar uma compra.
            </p>
          </motion.div>

          {/* Sections */}
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-heading font-bold mb-4">{section.title}</h2>
                    <div className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <p key={itemIndex} className="text-muted-foreground leading-relaxed">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

