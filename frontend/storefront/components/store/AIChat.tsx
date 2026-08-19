import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../../utils/api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const QUICK_REPLIES = [
  'Ver produtos em destaque',
  'Prazo de entrega',
  'Formas de pagamento',
  'Cupão de desconto',
];

/** Renderiza texto simples com suporte a **negrito** */
function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {lines.map((line, li) => {
        const segments = line.split(/\*\*([^*]+)\*\*/g);
        return (
          <span key={li}>
            {segments.map((seg, i) =>
              i % 2 === 1 ? <strong key={i}>{seg}</strong> : seg
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a Maria, assistente da Leia Sabores. Como posso ajudar?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Erro na API');

      const data = await response.json() as { success?: boolean; data?: { response?: string } };

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data?.response || 'Não consegui processar. Tenta novamente.',
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Serviço indisponível no momento. Contacta-nos pelo WhatsApp: +351 969 407 406',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showQuickReplies = messages.length <= 2 && !isLoading;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-50 w-14 h-14 bg-primary rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
            style={{
              right: 'calc(1.5rem + var(--safe-area-right, 0px))',
              bottom: 'calc(5.5rem + var(--safe-area-bottom, 0px))',
            }}
            aria-label="Abrir chat"
          >
            <Sparkles className="w-6 h-6 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
            style={{
              right: 'calc(1.5rem + var(--safe-area-right, 0px))',
              bottom: 'calc(1.5rem + var(--safe-area-bottom, 0px))',
              width: 'min(380px, calc(100vw - 2rem))',
              height: isMinimized ? 'auto' : 'min(560px, calc(100dvh - 5rem))',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Maria</div>
                <div className="text-xs text-white/70">Assistente Leia Sabores · online</div>
              </div>
              <button
                onClick={() => setIsMinimized(v => !v)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[83%] rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-white border border-border shadow-sm rounded-tl-sm text-foreground'
                        }`}
                      >
                        <MessageContent content={msg.content} />
                        <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                          {msg.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <div className="flex gap-1 items-center">
                          {[0, 150, 300].map(delay => (
                            <div
                              key={delay}
                              className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick replies — shown only at start */}
                  {showQuickReplies && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_REPLIES.map(qr => (
                        <button
                          key={qr}
                          onClick={() => sendMessage(qr)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-border bg-white flex-shrink-0">
                  <div className="flex gap-2 items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escreve uma mensagem..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 text-sm border border-border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 transition-shadow"
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isLoading}
                      className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      aria-label="Enviar"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
