import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Provider = 'openai' | 'anthropic';
type Mode = 'notes' | 'flashcards' | 'mindmap';

interface GeneratePayload {
  provider?: Provider;
  transcript?: string;
  mode?: Mode;
}

const MODE_PROMPTS: Record<Mode, string> = {
  notes:
    'You are an educational assistant. Turn the transcript into comprehensive lecture notes. Organize the response with clear section headings, explain each concept in depth, call out key definitions, examples, and any action items students should follow up on.',
  flashcards:
    'You are an educational assistant. Turn the transcript into a study deck. Provide 10 to 15 flashcards formatted as bullet points where each item is in the form "Q: ..." and "A: ...". Ensure coverage of all major topics discussed.',
  mindmap:
    'You are an educational assistant. Turn the transcript into a hierarchical mind map outline. Use nested bullet points to show the relationships between core topics, subtopics, and supporting details.'
};

const providerFromString = (input?: string): Provider | null => {
  if (!input) return null;
  const normalized = input.toLowerCase();
  if (normalized === 'openai' || normalized === 'chatgpt') return 'openai';
  if (normalized === 'anthropic' || normalized === 'claude') return 'anthropic';
  return null;
};

const modeFromString = (input?: string): Mode | null => {
  if (!input) return null;
  const normalized = input.toLowerCase();
  if (normalized === 'notes') return 'notes';
  if (normalized === 'flashcards' || normalized === 'flashcard') return 'flashcards';
  if (normalized === 'mindmap' || normalized === 'mind-map') return 'mindmap';
  return null;
};

async function callOpenAI(apiKey: string, transcript: string, mode: Mode) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5',
      temperature: 0.3,
      messages: [
        { role: 'system', content: MODE_PROMPTS[mode] },
        {
          role: 'user',
          content:
            'Here is the transcript of the class. Use it to complete the requested task. Transcript:\n\n' +
            transcript
        }
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
}

async function callAnthropic(apiKey: string, transcript: string, mode: Mode) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 20000,
      system: MODE_PROMPTS[mode],
      messages: [
        {
          role: 'user',
          content:
            'Here is the transcript of the class. Use it to complete the requested task. Transcript:\n\n' +
            transcript
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Anthropic request failed: ${message}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  const content = payload.content?.[0]?.text?.trim();
  if (!content) {
    throw new Error('Anthropic returned an empty response.');
  }

  return content;
}

const resolveApiKey = (provider: Provider): string | null => {
  if (provider === 'openai') {
    const value = process.env.OPENAI_API_KEY?.trim();
    return value?.length ? value : null;
  }

  const value = (process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY)?.trim();
  return value?.length ? value : null;
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
    return NextResponse.json({ error: 'A transcript is required to generate study materials.' }, { status: 400 });
  }

  try {
    const output =
      provider === 'openai'
        ? await callOpenAI(apiKey, transcript, mode)
        : await callAnthropic(apiKey, transcript, mode);

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
