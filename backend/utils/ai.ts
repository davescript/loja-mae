export type AIMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface CallAIOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Calls the configured LLM (Groq or OpenAI, detected from the key prefix) with
 * a chat-completions-style message array. Shared by the storefront chat
 * assistant and any admin content-generation tooling.
 */
export async function callAI(
  messages: AIMessage[],
  apiKey: string,
  options: CallAIOptions = {}
): Promise<string> {
  const isGroq = apiKey.startsWith('gsk_');
  const apiUrl = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = isGroq ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 350,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`AI API error: ${response.status} - ${JSON.stringify(err)}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const aiResponse = data.choices?.[0]?.message?.content;
  if (!aiResponse) throw new Error('Resposta vazia da IA');

  return aiResponse.trim();
}
