import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../admin/hooks/useToast';
import { Mail, Phone, Clock, Send, Loader2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Mensagem enviada!',
        description: 'Recebemos sua mensagem e entraremos em contato em breve.',
      });
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar',
        description: error?.message || 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await contactMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column - Contact Info */}
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">Contactos</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
            Fale com a nossa equipa para consultas de design, pedidos especiais ou suporte. 
            Valorizamos um atendimento calmo, eficiente e personalizado.
          </p>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground mb-1">Email</p>
                <a 
                  href="mailto:davecdl@outlook.com" 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  davecdl@outlook.com
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground mb-1">Telefone</p>
                <a 
                  href="tel:+351969407406" 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  +351 969 407 406
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground mb-1">Horário</p>
                <p className="text-foreground">Seg–Sex, 9h–18h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Contact Form */}
        <form 
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl bg-white border border-border/50 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-2xl font-heading font-bold mb-6">Envie-nos uma Mensagem</h2>
          
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nome *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full px-4 py-3 rounded-xl border bg-white transition-colors ${
                  errors.name ? 'border-destructive' : 'border-border'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Seu nome completo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl border bg-white transition-colors ${
                  errors.email ? 'border-destructive' : 'border-border'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Assunto *
              </label>
              <input
                id="subject"
                type="text"
                {...register('subject')}
                className={`w-full px-4 py-3 rounded-xl border bg-white transition-colors ${
                  errors.subject ? 'border-destructive' : 'border-border'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Assunto da mensagem"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Mensagem *
              </label>
              <textarea
                id="message"
                {...register('message')}
                rows={6}
                className={`w-full px-4 py-3 rounded-xl border bg-white transition-colors resize-none ${
                  errors.message ? 'border-destructive' : 'border-border'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Escreva sua mensagem aqui..."
              />
              {errors.message && (
                <p className="mt-1 text-sm text-destructive">{errors.message.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar Mensagem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
