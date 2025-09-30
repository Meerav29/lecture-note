import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { createClient } from '@deepgram/sdk';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Deepgram API key is not configured on the server.' },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const deepgram = createClient(apiKey);

  try {
    const transcription = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      model: 'nova-2',
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      diarize: false,
      detect_language: true,
      mimetype: file.type || 'audio/mpeg'
    });

    const channelData =
      (transcription as any)?.result?.results?.channels ??
      (transcription as any)?.result?.channels ??
      (transcription as any)?.results?.channels ??
      (transcription as any)?.channels;

    const alternative = channelData?.[0]?.alternatives?.[0];

    if (!alternative) {
      return NextResponse.json(
        { error: 'Deepgram did not return any transcript for the audio provided.' },
        { status: 502 }
      );
    }

    const transcriptText =
      alternative.paragraphs?.paragraphs
        ?.map((paragraph: any) => paragraph.sentences.map((s: any) => s.text).join(' '))
        .join('\n\n') || alternative.transcript || '';

    const metadata = (transcription as any)?.metadata ?? {};

    return NextResponse.json({
      transcript: transcriptText,
      metadata: {
        model: metadata?.model_info?.name ?? metadata?.model,
        duration: metadata?.duration,
        confidence: alternative.confidence
      }
    });
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while contacting Deepgram.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
