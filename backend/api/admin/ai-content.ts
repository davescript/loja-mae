import type { Env } from '../../types';
import { requireAdmin } from '../../utils/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { callAI, type AIMessage } from '../../utils/ai';
import { z } from 'zod';

const generateProductDescriptionSchema = z.object({
  title: z.string().trim().min(2).max(200),
  category: z.string().trim().max(100).optional(),
  keywords: z.string().trim().max(300).optional(),
});

export async function handleAdminAIContentRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);

    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (method === 'POST' && path === '/api/admin/ai-content/product-description') {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return errorResponse(
          'Geração por IA não está configurada. Defina OPENAI_API_KEY (aceita uma chave Groq ou OpenAI) com wrangler secret put.',
          503,
          { code: 'AI_NOT_CONFIGURED' }
        );
      }

      const body = generateProductDescriptionSchema.parse(await request.json());

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `És um copywriter de e-commerce para a Leia Sabores, loja portuguesa de acessórios premium para confeitaria e festas (toppers, gel corante, formas, embalagens, decorações).

Escreve sempre em português de Portugal, tom caloroso e profissional, sem clichês vazios ("qualidade incomparável", "não pode faltar") nem emojis.

Nunca inventes especificações técnicas, materiais, medidas ou certificações que não te foram fornecidas — descreve apenas o que é razoável inferir do nome e categoria do produto.

Responde APENAS com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato exato:
{"short_description": "...", "description": "..."}

- short_description: uma frase (máximo 160 caracteres) para listagens de produtos.
- description: 2 a 3 parágrafos curtos (máximo 500 caracteres no total), destacando o uso e para quem é ideal.`,
        },
        {
          role: 'user',
          content: [
            `Produto: ${body.title}`,
            body.category ? `Categoria: ${body.category}` : null,
            body.keywords ? `Detalhes adicionais: ${body.keywords}` : null,
          ].filter(Boolean).join('\n'),
        },
      ];

      let raw: string;
      try {
        raw = await callAI(messages, apiKey, { temperature: 0.7, maxTokens: 400 });
      } catch (aiError) {
        console.error('[AI_CONTENT] Error calling AI provider:', aiError);
        return errorResponse('Não foi possível gerar o conteúdo agora. Tenta novamente.', 502);
      }

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      let parsed: { short_description?: string; description?: string };
      try {
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch {
        console.error('[AI_CONTENT] Failed to parse AI response as JSON:', raw);
        return errorResponse('A IA devolveu uma resposta em formato inesperado. Tenta novamente.', 502);
      }

      if (!parsed.description) {
        return errorResponse('A IA não gerou uma descrição válida. Tenta novamente.', 502);
      }

      return successResponse({
        short_description: parsed.short_description || '',
        description: parsed.description,
      });
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}
