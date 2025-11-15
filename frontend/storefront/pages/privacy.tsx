import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Mail, Calendar } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: FileText,
      title: '1. Informações que Coletamos',
      content: [
        'Dados pessoais fornecidos voluntariamente: nome, endereço de e-mail, número de telefone, endereço postal, informações de pagamento.',
        'Dados de navegação: endereço IP, tipo de navegador, páginas visitadas, tempo de permanência no site.',
        'Dados de compra: histórico de pedidos, produtos visualizados, preferências de compra.',
        'Cookies e tecnologias similares para melhorar sua experiência de navegação.',
      ],
    },
    {
      icon: Eye,
      title: '2. Como Utilizamos suas Informações',
      content: [
        'Processar e entregar seus pedidos.',
        'Comunicar sobre o status do pedido, produtos e serviços.',
        'Melhorar nossos produtos e serviços através de análise de dados.',
        'Enviar comunicações de marketing (apenas com seu consentimento).',
        'Cumprir obrigações legais e regulamentares.',
        'Prevenir fraudes e garantir a segurança do site.',
      ],
    },
    {
      icon: Lock,
      title: '3. Proteção de Dados',
      content: [
        'Utilizamos tecnologias de segurança avançadas para proteger suas informações pessoais.',
        'Seus dados de pagamento são processados de forma segura através de gateways de pagamento certificados.',
        'Nunca armazenamos informações completas de cartão de crédito em nossos servidores.',
        'Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado.',
      ],
    },
    {
      icon: Shield,
      title: '4. Seus Direitos',
      content: [
        'Direito de acesso: pode solicitar uma cópia dos dados pessoais que temos sobre si.',
        'Direito de retificação: pode corrigir dados pessoais incorretos ou incompletos.',
        'Direito ao apagamento: pode solicitar a eliminação dos seus dados pessoais.',
        'Direito à portabilidade: pode solicitar a transferência dos seus dados para outro prestador.',
        'Direito de oposição: pode opor-se ao processamento dos seus dados para fins de marketing.',
        'Direito de limitação: pode solicitar a limitação do processamento dos seus dados.',
      ],
    },
    {
      icon: FileText,
      title: '5. Cookies',
      content: [
        'Utilizamos cookies para melhorar a funcionalidade do site e personalizar sua experiência.',
        'Pode gerir as preferências de cookies através das configurações do seu navegador.',
        'Alguns cookies são essenciais para o funcionamento do site e não podem ser desativados.',
      ],
    },
    {
      icon: Mail,
      title: '6. Comunicações de Marketing',
      content: [
        'Apenas enviaremos comunicações de marketing com o seu consentimento explícito.',
        'Pode cancelar a subscrição a qualquer momento através do link presente em cada e-mail.',
        'Respeitamos sempre a sua escolha e não enviaremos comunicações não solicitadas.',
      ],
    },
    {
      icon: Calendar,
      title: '7. Retenção de Dados',
      content: [
        'Mantemos os seus dados pessoais apenas pelo tempo necessário para cumprir os fins para os quais foram coletados.',
        'Dados de pedidos são mantidos por um período mínimo de 7 anos conforme exigido pela legislação fiscal portuguesa.',
        'Após o período de retenção, os dados são eliminados de forma segura.',
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Política de Privacidade
            </h1>
            <p className="text-lg text-muted-foreground">
              A sua privacidade é importante para nós. Esta política explica como coletamos, utilizamos e protegemos as suas informações pessoais.
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
              A <strong>Leiasabores</strong> está comprometida em proteger a privacidade e os dados pessoais dos nossos clientes. 
              Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as suas informações pessoais 
              quando utiliza o nosso website e serviços, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) 
              da União Europeia e a legislação portuguesa aplicável.
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

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 md:p-10"
          >
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. Contacto e Exercício de Direitos
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Para exercer os seus direitos ou esclarecer qualquer dúvida sobre esta Política de Privacidade, 
                  pode contactar-nos através de:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">Email:</strong> privacidade@leiasabores.pt</p>
                  <p><strong className="text-foreground">Telefone:</strong> +351 969 407 406</p>
                  <p><strong className="text-foreground">Endereço:</strong> Rua Exemplo, 123, Lisboa, Portugal</p>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  Temos 30 dias para responder ao seu pedido, conforme exigido pelo RGPD.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Final Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="prose prose-lg max-w-none bg-muted/30 rounded-2xl p-6 md:p-8"
          >
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Alterações a esta Política:</strong> Podemos atualizar esta Política de Privacidade 
              periodicamente. Notificaremos sobre alterações significativas através do nosso website ou por e-mail.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ao utilizar o nosso website e serviços, reconhece que leu e compreendeu esta Política de Privacidade. 
              Se não concordar com esta política, por favor, não utilize os nossos serviços.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

