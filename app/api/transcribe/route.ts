import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { resolveTranscriptionProvider } from '../../../lib/providers';

export const runtime = 'nodejs';

const isFile = (value: FormDataEntryValue | null): value is File => value instanceof File;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fileEntry = formData.get('file');

  if (!isFile(fileEntry)) {
    return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
  }

  const providerField = formData.get('provider');
  const providerName = typeof providerField === 'string' ? providerField.toLowerCase() : undefined;
  const provider = resolveTranscriptionProvider(providerName);

  try {
    const arrayBuffer = await fileEntry.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const result = await provider({
      audio: audioBuffer,
      mimeType: fileEntry.type || undefined,
      options: {
        model: 'nova-3',
        language: 'en',
        summarize: 'v2',
        smartFormat: true,
        paragraphs: true,
        punctuate: true
      }
    });

    return NextResponse.json({
      transcript: result.transcript,
      metadata: {
        model: result.metadata.model,
        duration: result.metadata.duration,
        confidence: result.metadata.confidence,
        summary: result.metadata.summary,
        language: result.metadata.language
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while contacting the transcription provider.';

    if (error instanceof Error) {
      console.error('Transcription error:', error);
    } else {
      console.error('Transcription error:', { error });
    }

    const status = message.includes('API key') ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
