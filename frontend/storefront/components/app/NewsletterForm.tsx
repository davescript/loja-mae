import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '../../../utils/api';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Por favor, insira um email válido');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await apiRequest<{ message: string; subscribed?: boolean; already_subscribed?: boolean }>('/api/newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });

            if (response.data?.already_subscribed) {
                setStatus('success');
                setMessage('Você já está inscrito! 🎉');
            } else {
                setStatus('success');
                setMessage('Inscrição realizada! Verifique seu email 📧');
                setEmail('');
            }

            // Reset after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Erro ao processar inscrição. Tente novamente.');

            // Reset after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        }
    };

    return (
        <div className="relative glass-card p-8 md:p-12 text-center border-0">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-heading font-bold mb-3"
            >
                Receba nossas novidades
            </motion.h2>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mb-8 max-w-md mx-auto"
            >
                Cadastre-se e receba ofertas exclusivas, lançamentos e dicas de decoração
            </motion.p>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
                <input
                    type="email"
                    placeholder="Seu melhor email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input flex-1 bg-white/80 backdrop-blur-sm"
                    required
                    disabled={status === 'loading' || status === 'success'}
                />
                <motion.button
                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                    whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="btn btn-primary whitespace-nowrap shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando...
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Inscrito!
                        </>
                    ) : (
                        'Inscrever-se'
                    )}
                </motion.button>
            </motion.form>

            {/* Feedback Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-2 text-sm ${status === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                >
                    {status === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    {message}
                </motion.div>
            )}
        </div>
    );
}
