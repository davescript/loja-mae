import { motion } from 'framer-motion';
import { RotateCcw, Clock, Package, AlertCircle, CheckCircle, Phone, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <RotateCcw className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Política de Devoluções e Reembolsos
            </h1>
            <p className="text-lg text-muted-foreground">
              A sua satisfação é a nossa prioridade. Conheça os seus direitos e o nosso processo simples de devolução.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Última atualização: {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Resumo rápido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              { icon: Clock, title: '14 dias', desc: 'Prazo para devolver sem justificação' },
              { icon: CheckCircle, title: 'Reembolso total', desc: 'Valor do produto + portes de envio originais' },
              { icon: ShieldCheck, title: '2 anos de garantia', desc: 'Garantia legal em produtos defeituosos' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center p-5 rounded-xl border bg-muted/30">
                <item.icon className="w-8 h-8 text-primary mb-2" />
                <p className="font-bold text-lg">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Secção 1: Direito de arrependimento */}
          <Section icon={RotateCcw} title="1. Direito de Arrependimento (14 dias)" delay={0.15}>
            <p>
              Ao abrigo do Decreto-Lei n.º 24/2014 e da Diretiva Europeia 2011/83/UE, tem o direito de rescindir o contrato de compra
              <strong> no prazo de 14 dias de calendário</strong> após a receção do produto, sem necessidade de apresentar qualquer justificação.
            </p>
            <p className="mt-3">
              Para exercer este direito, notifique-nos antes de terminar o prazo de 14 dias através de:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              <li>Email: <a href="mailto:davecdl@outlook.com" className="text-primary underline">davecdl@outlook.com</a></li>
              <li>Telefone: <a href="tel:+351969407406" className="text-primary underline">+351 969 407 406</a></li>
              <li>Formulário de contato disponível em <Link to="/contact" className="text-primary underline">/contact</Link></li>
            </ul>
            <p className="mt-3">
              Após receber a sua notificação, enviar-lhe-emos confirmação de receção do pedido de devolução por email.
              Deverá devolver o produto <strong>no prazo de 14 dias</strong> após a comunicação da sua decisão de desistência.
            </p>
          </Section>

          {/* Secção 2: Condições */}
          <Section icon={Package} title="2. Condições de Devolução" delay={0.2}>
            <p>Para que a devolução seja aceite, o produto deve ser devolvido:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li>Em perfeito estado, sem sinais de uso, danos ou alterações</li>
              <li>Na embalagem original (sempre que possível), com etiquetas intactas</li>
              <li>Acompanhado de todos os acessórios, documentação e oferta incluídos</li>
              <li>Com a fatura ou comprovativo de compra</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
              <strong>Nota:</strong> Pode ser aplicada uma redução no reembolso se o produto tiver sido manuseado
              de forma que exceda o necessário para verificar a sua natureza, características e funcionamento.
            </p>
          </Section>

          {/* Secção 3: Produtos excluídos */}
          <Section icon={AlertCircle} title="3. Produtos Excluídos do Direito de Devolução" delay={0.25}>
            <p>Nos termos da legislação em vigor, os seguintes produtos <strong>não são elegíveis</strong> para devolução:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li><strong>Produtos personalizados</strong> — toppers, decorações ou artigos produzidos especificamente a pedido do cliente com nome, data ou design exclusivo</li>
              <li>Produtos com selo de higiene violado (ex.: produtos alimentares embalados)</li>
              <li>Produtos que, pela sua natureza, ficaram misturados com outros artigos após a entrega</li>
            </ul>
          </Section>

          {/* Secção 4: Processo */}
          <Section icon={CheckCircle} title="4. Como Iniciar uma Devolução" delay={0.3}>
            <ol className="space-y-4">
              {[
                { n: '1', t: 'Notifique-nos', d: 'Contacte-nos por email ou telefone indicando o número do pedido e o motivo da devolução. Responderemos em 1 dia útil com instruções detalhadas.' },
                { n: '2', t: 'Embale o produto', d: 'Embale o produto de forma segura, de preferência na embalagem original. Inclua a fatura ou comprovativo de compra.' },
                { n: '3', t: 'Envie o produto', d: 'Envie o produto para a morada que lhe indicaremos. Os custos de devolução são da sua responsabilidade, exceto em caso de produto defeituoso ou envio errado da nossa parte.' },
                { n: '4', t: 'Reembolso processado', d: 'Após receção e verificação do produto, processamos o reembolso no prazo máximo de 14 dias.' },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold">{step.t}</p>
                    <p className="text-sm text-muted-foreground mt-1">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* Secção 5: Reembolso */}
          <Section icon={CheckCircle} title="5. Reembolsos" delay={0.35}>
            <ul className="space-y-3 text-muted-foreground">
              <li>✅ O reembolso é processado no prazo de <strong>14 dias</strong> após receção e verificação do produto</li>
              <li>✅ O reembolso inclui o <strong>valor total do produto</strong> e os portes de envio originais (custo de entrega padrão mais baixo disponível)</li>
              <li>✅ O reembolso é efetuado através do <strong>mesmo método de pagamento</strong> utilizado na compra</li>
              <li>✅ Se pagou com <strong>Klarna</strong>, o reembolso será processado diretamente pela Klarna após confirmação da nossa parte. O prazo de crédito na sua conta pode variar conforme as condições da Klarna</li>
              <li>✅ Se pagou com <strong>MB Way ou cartão</strong>, o prazo de crédito depende do banco emissor (normalmente 3–5 dias úteis)</li>
            </ul>
          </Section>

          {/* Secção 6: Defeituosos */}
          <Section icon={ShieldCheck} title="6. Produtos Defeituosos ou Incorretos" delay={0.4}>
            <p>
              Se receber um produto <strong>defeituoso, danificado no transporte ou diferente do que encomendou</strong>,
              tem direito a:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li>Reparação ou substituição do produto</li>
              <li>Redução proporcional do preço</li>
              <li>Resolução do contrato com reembolso integral</li>
            </ul>
            <p className="mt-3">
              Nestes casos, <strong>os custos de devolução são inteiramente suportados pela Leiasabores</strong>.
              Contacte-nos no prazo de <strong>2 meses</strong> após a deteção do defeito.
              A garantia legal cobre defeitos durante <strong>2 anos</strong> após a entrega.
            </p>
          </Section>

          {/* Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contacto para Devoluções
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:davecdl@outlook.com" className="hover:underline text-primary">davecdl@outlook.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+351969407406" className="hover:underline text-primary">+351 969 407 406</a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Disponíveis de segunda a sexta, das 9h às 18h (hora de Lisboa).
              Respondemos a todos os pedidos de devolução no prazo de 1 dia útil.
            </p>
          </motion.div>

          {/* Nota Klarna */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="border rounded-xl p-5 bg-[#fef5ff]"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl font-black text-[#17120f] italic">K</span>
              <div>
                <p className="font-semibold">Compras com Klarna</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Se realizou a sua compra com Klarna (Pagar em 3 vezes), o reembolso será efetuado
                  diretamente pela Klarna após confirmação da devolução da nossa parte.
                  A Klarna irá ajustar ou cancelar as prestações pendentes. Para questões específicas
                  sobre o seu plano de pagamento Klarna, contacte o{' '}
                  <a href="https://www.klarna.com/pt/servico-ao-cliente/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Serviço ao Cliente Klarna
                  </a>.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: React.ElementType;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-heading font-bold pt-2">{title}</h2>
      </div>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </motion.div>
  );
}
