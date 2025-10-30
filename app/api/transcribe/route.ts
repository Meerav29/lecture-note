import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { resolveTranscriptionProvider } from '../../../lib/providers';

export const runtime = 'nodejs';

const isFile = (value: FormDataEntryValue | null): value is File => value instanceof File;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!isFile(fileEntry)) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
    }

    // Log file info for debugging
    console.log(`[Transcribe] Processing file: ${fileEntry.name}, size: ${fileEntry.size} bytes (${(fileEntry.size / (1024 * 1024)).toFixed(2)} MB), type: ${fileEntry.type}`);

    // Check file size (warn if > 50MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (fileEntry.size > MAX_FILE_SIZE) {
      console.error(`[Transcribe] File too large: ${(fileEntry.size / (1024 * 1024)).toFixed(2)} MB`);
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(fileEntry.size / (1024 * 1024)).toFixed(2)}MB.` },
        { status: 413 }
      );
    }

    const providerField = formData.get('provider');
    const providerName = typeof providerField === 'string' ? providerField.toLowerCase() : undefined;
    const provider = resolveTranscriptionProvider(providerName);

    const arrayBuffer = await fileEntry.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    console.log(`[Transcribe] Starting transcription with ${providerName || 'default'} provider...`);
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

    console.log(`[Transcribe] Transcription completed successfully. Duration: ${result.metadata.duration}s, Confidence: ${result.metadata.confidence}`);

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
    // Enhanced error logging
    console.error('[Transcribe] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      error
    });

    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while contacting the transcription provider.';

    const status = message.includes('API key') ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
