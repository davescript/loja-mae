import type { Env } from '../../types';
import { handleError } from '../../utils/errors';
import { successResponse, errorResponse } from '../../utils/response';
import { getDb } from '../../utils/db';
import { listProducts } from '../../modules/products';
import { listCategories } from '../../modules/categories';
import { callAI, type AIMessage } from '../../utils/ai';

export async function handleChatRoutes(request: Request, env: Env): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    const openaiApiKey = env.OPENAI_API_KEY;

    if (openaiApiKey) {
      try {
        const db = getDb(env);
        const categories = await listCategories(db, { is_active: 1 });
        const productsResult = await listProducts(db, {
          status: 'active',
          pageSize: 100,
          sortBy: 'featured',
          sortOrder: 'desc',
        });

        const catalogContext = formatCatalogContext(categories, productsResult.items);

        const aiResponse = await callChatAI(
          body.message,
          body.conversation || [],
          openaiApiKey,
          catalogContext
        );

        return successResponse({
          response: aiResponse,
          timestamp: new Date().toISOString(),
          source: 'ai',
        });
      } catch (aiError) {
        console.error('AI error, falling back to keyword responses:', aiError);
      }
    }

    const response = generateFallbackResponse(body.message);
    return successResponse({
      response,
      timestamp: new Date().toISOString(),
      source: 'keyword',
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return errorResponse('Erro ao processar mensagem', 500);
  }
}

function formatCatalogContext(categories: any[], products: any[]): string {
  let context = 'CATEGORIAS:\n';
  categories.forEach(cat => {
    context += `- ${cat.name}\n`;
  });

  context += '\nPRODUTOS DISPONÍVEIS:\n';
  products.forEach(prod => {
    const price = (prod.price_cents / 100).toFixed(2);
    const inStock = prod.track_inventory ? prod.stock_quantity > 0 : true;
    context += `- "${prod.title}" | €${price} | ${inStock ? 'em stock' : 'esgotado'}\n`;
  });

  return context;
}

async function callChatAI(
  message: string,
  conversation: Array<{ role: string; content: string }>,
  apiKey: string,
  catalogContext: string
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `És a Maria, assistente virtual da Leia Sabores — loja premium de acessórios para confeitaria e festas.

REGRAS OBRIGATÓRIAS:
1. Respostas CURTAS e diretas: máximo 3-4 linhas. Sem introduções desnecessárias.
2. Tom: respeitoso, caloroso e profissional. Trata o cliente com consideração.
3. NUNCA incluas links, URLs ou slugs nas respostas. Apenas texto limpo.
4. Se mencionares produtos, usa apenas o nome — sem endereços web.
5. Lista no máximo 4-5 produtos quando pedido, com preço e disponibilidade.
6. NUNCA inventes produtos que não estão no catálogo abaixo.
7. Se não souberes responder, sugere contacto via WhatsApp: +351 969 407 406
8. Usa no máximo 1 emoji por resposta, e apenas quando for natural.

INFORMAÇÕES DA LOJA:
- WhatsApp: +351 969 407 406
- Email: suporte@leiasabores.pt
- Entrega: 2-5 dias úteis, Portugal Continental
- Devoluções: 14 dias após o recebimento (direito de livre resolução)
- Desconto primeira compra: cupão GET20OFF (20%)
- Pagamentos: Cartão, MB Way, Apple Pay, Google Pay (via Stripe, seguro)

${catalogContext}

Responde sempre em português de Portugal, de forma clara e respeitosa.`,
    },
  ];

  const recentConversation = conversation.slice(-8);
  for (const msg of recentConversation) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }
  messages.push({ role: 'user', content: message });

  return callAI(messages, apiKey, { temperature: 0.5, maxTokens: 350 });
}

function generateFallbackResponse(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('preço') || m.includes('quanto') || m.includes('custa') || m.includes('valor'))
    return 'Os preços estão visíveis em cada produto. Diz-me qual produto te interessa e dou-te o preço!';

  if (m.includes('entrega') || m.includes('envio') || m.includes('prazo') || m.includes('frete'))
    return 'Entrega em 2-5 dias úteis para Portugal Continental. O valor do frete é calculado no checkout.';

  if (m.includes('desconto') || m.includes('promoção') || m.includes('cupão') || m.includes('cupom'))
    return 'Usa o cupão GET20OFF para 20% de desconto na primeira compra. 🎉';

  if (m.includes('contato') || m.includes('whatsapp') || m.includes('telefone') || m.includes('falar'))
    return 'Estamos disponíveis pelo WhatsApp: +351 969 407 406 ou email: suporte@leiasabores.pt';

  if (m.includes('devoluç') || m.includes('troca') || m.includes('reembolso'))
    return 'Podes devolver em até 14 dias após o recebimento, sem precisar de justificação. Contacta-nos pelo WhatsApp para iniciar o processo.';

  if (m.includes('pagamento') || m.includes('pagar') || m.includes('cartão') || m.includes('mbway'))
    return 'Aceitamos Cartão, MB Way, Apple Pay e Google Pay — tudo processado via Stripe de forma segura.';

  return 'Olá! Posso ajudar com produtos, preços, entregas ou encomendas. O que precisas?';
}
