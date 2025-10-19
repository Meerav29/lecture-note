export type LLMProvider = 'openai' | 'anthropic';

export interface LLMChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMCallOptions {
  provider: LLMProvider;
  apiKey: string;
  system: string;
  messages: LLMChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export const providerFromString = (input?: string): LLMProvider | null => {
  if (!input) return null;
  const normalized = input.toLowerCase();
  if (normalized === 'openai' || normalized === 'chatgpt') return 'openai';
  if (normalized === 'anthropic' || normalized === 'claude') return 'anthropic';
  return null;
};

export const resolveApiKey = (provider: LLMProvider): string | null => {
  if (provider === 'openai') {
    const value = process.env.OPENAI_API_KEY?.trim();
    return value?.length ? value : null;
  }

  const value = (process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY)?.trim();
  return value?.length ? value : null;
};

const callOpenAI = async ({
  apiKey,
  system,
  messages,
  temperature
}: Omit<LLMCallOptions, 'provider' | 'maxOutputTokens'>) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5',
      temperature: temperature ?? 0.3,
      messages: [
        { role: 'system', content: system },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed: ${message}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return content;
};

const callAnthropic = async ({
  apiKey,
  system,
  messages,
  temperature,
  maxOutputTokens
}: Omit<LLMCallOptions, 'provider'>) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxOutputTokens ?? 1500,
      temperature: temperature ?? 0.3,
      system,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Anthropic request failed: ${message}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  const content = payload.content?.map((entry) => entry.text ?? '').join('\n').trim();
  if (!content) {
    throw new Error('Anthropic returned an empty response.');
  }

  return content;
};

export const callLLM = async (options: LLMCallOptions) => {
  const { provider, ...rest } = options;
  if (provider === 'openai') {
    return callOpenAI(rest);
  }

  return callAnthropic(rest);
};
