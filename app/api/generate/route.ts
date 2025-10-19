import { NextRequest, NextResponse } from 'next/server';
import {
  callLLM,
  providerFromString,
  resolveApiKey,
  type LLMChatMessage
} from '../../../lib/providers/llm';

export const runtime = 'nodejs';

type Mode = 'notes' | 'flashcards' | 'mindmap';

interface GeneratePayload {
  provider?: string;
  transcript?: string;
  mode?: string;
}

const MODE_PROMPTS: Record<Mode, string> = {
  notes:
    'You are an educational assistant. Turn the transcript into comprehensive lecture notes. Organize the response with clear section headings, explain each concept in depth, call out key definitions, examples, and any action items students should follow up on.',
  flashcards:
    'You are an educational assistant. Turn the transcript into a study deck. Provide 10 to 15 flashcards formatted as bullet points where each item is in the form "Q: ..." and "A: ...". Ensure coverage of all major topics discussed.',
  mindmap:
    'You are an educational assistant. Turn the transcript into a hierarchical mind map outline. Use nested bullet points to show the relationships between core topics, subtopics, and supporting details.'
};

const modeFromString = (input?: string): Mode | null => {
  if (!input) return null;
  const normalized = input.toLowerCase();
  if (normalized === 'notes') return 'notes';
  if (normalized === 'flashcards' || normalized === 'flashcard') return 'flashcards';
  if (normalized === 'mindmap' || normalized === 'mind-map') return 'mindmap';
  return null;
};

export async function POST(request: NextRequest) {
  let body: GeneratePayload;
  try {
    body = (await request.json()) as GeneratePayload;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const provider = providerFromString(body.provider);
  const mode = modeFromString(body.mode);
  const transcript = body.transcript?.trim();

  if (!provider) {
    return NextResponse.json({ error: 'Unsupported or missing provider.' }, { status: 400 });
  }

  if (!mode) {
    return NextResponse.json({ error: 'Unsupported or missing generation mode.' }, { status: 400 });
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

  if (!transcript) {
    return NextResponse.json(
      { error: 'A transcript is required to generate study materials.' },
      { status: 400 }
    );
  }

  try {
    const messages: LLMChatMessage[] = [
      {
        role: 'user',
        content:
          'Here is the transcript of the class. Use it to complete the requested task. Transcript:\n\n' +
          transcript
      }
    ];

    const output = await callLLM({
      provider,
      apiKey,
      system: MODE_PROMPTS[mode],
      temperature: 0.3,
      maxOutputTokens: provider === 'anthropic' ? 20000 : undefined,
      messages
    });

    return NextResponse.json({ output });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while contacting the language model.';

    console.error('Generation error:', error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
