import { NextRequest, NextResponse } from 'next/server';
import {
  callLLM,
  providerFromString,
  resolveApiKey,
  type LLMChatMessage
} from '../../../lib/providers/llm';

export const runtime = 'nodejs';

interface ChatMessagePayload {
  role?: string;
  content?: unknown;
}

interface ChatRequestPayload {
  provider?: string;
  transcript?: string;
  messages?: ChatMessagePayload[];
}

const SYSTEM_PROMPT =
  'You are a thoughtful study companion. Answer every question using only the transcript provided in the context. If the transcript does not contain the answer, reply that you could not find it in the transcript. Keep responses concise, but explain reasoning when helpful.';

const sanitizeMessages = (rawMessages: ChatMessagePayload[] | undefined): LLMChatMessage[] => {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const role = entry.role?.toLowerCase();
      if (role !== 'user' && role !== 'assistant') {
        return null;
      }

      const content = typeof entry.content === 'string' ? entry.content.trim() : '';
      if (!content) {
        return null;
      }

      return { role, content } as LLMChatMessage;
    })
    .filter((value): value is LLMChatMessage => Boolean(value));
};

export async function POST(request: NextRequest) {
  let body: ChatRequestPayload;
  try {
    body = (await request.json()) as ChatRequestPayload;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const provider = providerFromString(body.provider);
  const transcript = body.transcript?.trim();
  const conversation = sanitizeMessages(body.messages);

  if (!provider) {
    return NextResponse.json({ error: 'Unsupported or missing provider.' }, { status: 400 });
  }

  if (!transcript) {
    return NextResponse.json({ error: 'A transcript is required to chat with your notes.' }, { status: 400 });
  }

  if (!conversation.length) {
    return NextResponse.json({ error: 'At least one user message is required.' }, { status: 400 });
  }

  const lastMessage = conversation[conversation.length - 1];
  if (lastMessage.role !== 'user') {
    return NextResponse.json({ error: 'Conversations must end with a user question.' }, { status: 400 });
  }

  const apiKey = resolveApiKey(provider);
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          provider === 'openai'
            ? 'OPENAI_API_KEY is not configured on the server.'
            : 'CLAUDE_API_KEY (or ANTHROPIC_API_KEY) is not configured on the server.'
      },
      { status: 500 }
    );
  }

  try {
    const contextMessage: LLMChatMessage = {
      role: 'user',
      content:
        'Context: Use only the following lecture transcript as your knowledge base. If information is missing, say so. Transcript:\n"""\n' +
        transcript +
        '\n"""'
    };

    const messages = [contextMessage, ...conversation];
    const answer = await callLLM({
      provider,
      apiKey,
      system: SYSTEM_PROMPT,
      temperature: 0.2,
      maxOutputTokens: provider === 'anthropic' ? 1200 : undefined,
      messages
    });

    const responseMessage: LLMChatMessage = {
      role: 'assistant',
      content: answer
    };

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while contacting the language model.';

    console.error('Chat error:', error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
