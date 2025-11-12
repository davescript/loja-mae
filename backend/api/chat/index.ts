import type { Env } from '../../types';
import { handleCORS } from '../../utils/cors';
import { handleError } from '../../utils/errors';
import { successResponse, errorResponse } from '../../utils/response';

export async function handleChatRoutes(request: Request, env: Env): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // POST /api/chat - Processar mensagem do chat
    if (method === 'POST' && path === '/api/chat') {
      return await handleChatMessage(request, env);
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    console.error('Chat route error:', error);
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

async function handleChatMessage(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      message: string;
      conversation?: Array<{ role: string; content: string }>;
    };

    if (!body.message || typeof body.message !== 'string') {
      return errorResponse('Mensagem é obrigatória', 400);
    }

    // Respostas inteligentes baseadas em palavras-chave
    const response = generateAIResponse(body.message, body.conversation || []);

    return successResponse({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return errorResponse('Erro ao processar mensagem', 500);
  }
}

function generateAIResponse(message: string, conversation: Array<{ role: string; content: string }>): string {
  const lowerMessage = message.toLowerCase();
  
  // Respostas sobre preços
  if (lowerMessage.includes('preço') || lowerMessage.includes('quanto custa') || lowerMessage.includes('valor') || lowerMessage.includes('custa')) {
    return 'Os preços variam conforme o produto. Você pode verificar os preços na página de produtos ou me dizer qual produto te interessa! 💰\n\nTambém temos promoções especiais - fique de olho nas ofertas!';
  }
  
  // Respostas sobre entrega
  if (lowerMessage.includes('entrega') || lowerMessage.includes('frete') || lowerMessage.includes('envio') || lowerMessage.includes('prazo')) {
    return 'Oferecemos entrega rápida! 🚚\n\n• Prazo: 2-5 dias úteis\n• Frete calculado no checkout\n• Entrega expressa disponível\n\nPara mais informações sobre envios, entre em contato pelo WhatsApp: +351 969 407 406';
  }
  
  // Respostas sobre estoque
  if (lowerMessage.includes('estoque') || lowerMessage.includes('disponível') || lowerMessage.includes('tem') || lowerMessage.includes('disponibilidade')) {
    return 'A disponibilidade dos produtos é atualizada em tempo real! 📦\n\nVerifique na página do produto ou entre em contato conosco para confirmar a disponibilidade de itens específicos.';
  }
  
  // Respostas sobre contato
  if (lowerMessage.includes('contato') || lowerMessage.includes('telefone') || lowerMessage.includes('whatsapp') || lowerMessage.includes('falar')) {
    return 'Estamos aqui para ajudar! 📱\n\n• WhatsApp: +351 969 407 406\n• Email: contato@lojama.com\n• Instagram: @leiasabores\n\nHorário de atendimento: Segunda a Sexta, 9h às 18h';
  }
  
  // Respostas sobre produtos
  if (lowerMessage.includes('produto') || lowerMessage.includes('categoria') || lowerMessage.includes('o que vocês vendem') || lowerMessage.includes('tipo')) {
    return 'Temos uma ampla variedade de produtos para confeitaria e eventos! 🛍️\n\n• Formas para bolos\n• Toppers decorativos\n• Acessórios de confeitaria\n• Caixas e embalagens\n• Balões e decorações\n\nExplore nossa página de categorias ou use a busca para encontrar o que precisa!';
  }
  
  // Respostas sobre pedidos
  if (lowerMessage.includes('pedido') || lowerMessage.includes('compra') || lowerMessage.includes('como comprar') || lowerMessage.includes('checkout')) {
    return 'Fazer um pedido é muito fácil! 💳\n\n1. Adicione os produtos ao carrinho\n2. Vá para o checkout\n3. Preencha seus dados\n4. Escolha a forma de pagamento\n5. Finalize sua compra\n\nAceitamos pagamentos seguros via Stripe. Precisa de ajuda com algo específico?';
  }
  
  // Respostas sobre devoluções
  if (lowerMessage.includes('devolução') || lowerMessage.includes('troca') || lowerMessage.includes('reembolso') || lowerMessage.includes('cancelar')) {
    return 'Nossa política de devoluções: 🔄\n\n• Prazo: 7 dias após o recebimento\n• Produto deve estar em perfeito estado\n• Entre em contato pelo WhatsApp para iniciar o processo\n\nEstamos sempre prontos para ajudar!';
  }
  
  // Respostas sobre promoções
  if (lowerMessage.includes('promoção') || lowerMessage.includes('desconto') || lowerMessage.includes('oferta') || lowerMessage.includes('cupom')) {
    return 'Temos promoções especiais! 🎉\n\n• Use o cupom GET20OFF para 20% de desconto\n• Fique de olho nas ofertas da semana\n• Siga nosso Instagram @leiasabores para novidades\n\nAproveite!';
  }
  
  // Respostas sobre qualidade
  if (lowerMessage.includes('qualidade') || lowerMessage.includes('material') || lowerMessage.includes('durabilidade')) {
    return 'Trabalhamos apenas com produtos de alta qualidade! ✨\n\n• Materiais premium\n• Acabamento impecável\n• Produtos testados e aprovados\n\nGarantimos a satisfação dos nossos clientes!';
  }
  
  // Resposta padrão
  return 'Obrigado pela sua mensagem! 😊\n\nSou o assistente virtual da Loja Mãe. Posso ajudar com:\n\n• Informações sobre produtos\n• Preços e promoções\n• Prazos de entrega\n• Como fazer pedidos\n• Políticas de devolução\n\nPara questões mais específicas, entre em contato pelo WhatsApp: +351 969 407 406\n\nComo posso ajudá-lo hoje?';
}

