import { createClient, type PrerecordedSchema, type SyncPrerecordedResponse } from '@deepgram/sdk';
import type { TranscriptionProvider, TranscriptionRequest, TranscriptionResult } from '../types';

type DeepgramSchema = PrerecordedSchema & { mimetype?: string };

type Channel = SyncPrerecordedResponse['results']['channels'][number];

type Alternative = Channel['alternatives'][number];

const DEFAULT_OPTIONS: DeepgramSchema = {
  model: 'nova-3',
  language: 'en',
  summarize: 'v2',
  smart_format: true,
  punctuate: true,
  diarize: false,
  paragraphs: true
};

const DEFAULT_MIME_TYPE = 'audio/mpeg';

const formatParagraphs = (paragraphGroup: Alternative['paragraphs'] | undefined) => {
  if (!paragraphGroup?.paragraphs?.length) {
    return null;
  }

  const formatted = paragraphGroup.paragraphs
    .map((paragraph) =>
      paragraph.sentences
        .map((sentence) => sentence.text.trim())
        .filter(Boolean)
        .join(' ')
        .trim()
    )
    .filter(Boolean)
    .join('\n\n')
    .trim();

  return formatted || null;
};

const extractSummary = (
  alternative: Alternative | undefined,
  results: SyncPrerecordedResponse['results']
) => {
  const alternativeSummary = alternative?.summaries
    ?.map((summary) => summary.summary)
    .filter((value): value is string => Boolean(value))
    .join('\n\n');

  if (alternativeSummary) {
    return alternativeSummary;
  }

  return results.summary?.result || results.summary?.short || undefined;
};

const extractModelName = (metadata: SyncPrerecordedResponse['metadata']) => {
  const modelInfoValues = metadata?.model_info ? Object.values(metadata.model_info) : [];

  if (modelInfoValues.length > 0) {
    const [info] = modelInfoValues;
    if (info?.name) {
      return info.name;
    }
  }

  if (metadata?.models?.length) {
    return metadata.models[0];
  }

  return undefined;
};

const buildOptions = (request: TranscriptionRequest): DeepgramSchema => {
  const overrides = request.options ?? {};

  const options: DeepgramSchema = {
    ...DEFAULT_OPTIONS,
    ...(typeof overrides.model === 'string' ? { model: overrides.model } : {}),
    ...(typeof overrides.language === 'string' ? { language: overrides.language } : {}),
    ...(overrides.summarize !== undefined ? { summarize: overrides.summarize } : {}),
    ...(overrides.diarize !== undefined ? { diarize: overrides.diarize } : {}),
    ...(overrides.paragraphs !== undefined ? { paragraphs: overrides.paragraphs } : {}),
    ...(overrides.smartFormat !== undefined ? { smart_format: overrides.smartFormat } : {}),
    ...(overrides.punctuate !== undefined ? { punctuate: overrides.punctuate } : {})
  };

  const mimeType = request.mimeType ?? DEFAULT_MIME_TYPE;
  return { ...options, mimetype: mimeType };
};

export const transcribeWithDeepgram: TranscriptionProvider = async (
  request: TranscriptionRequest
): Promise<TranscriptionResult> => {
  const apiKey = request.apiKey ?? process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    throw new Error('Deepgram API key is not configured.');
  }

  if (!request.audio || request.audio.length === 0) {
    throw new Error('Audio buffer is empty; cannot transcribe.');
  }

  const client = createClient(apiKey);
  const options = buildOptions(request);
  const response = await client.listen.prerecorded.transcribeFile(request.audio, options);

  if (!response || response.error || !response.result) {
    const message = response?.error?.message ?? 'Deepgram did not return a result.';
    throw new Error(message);
  }

  const payload = response.result;
  const firstChannel: Channel | undefined = payload.results.channels?.[0];
  const alternative: Alternative | undefined = firstChannel?.alternatives?.[0];

  if (!alternative) {
    throw new Error('Deepgram returned an empty transcription result.');
  }

  const transcriptFromParagraphs = formatParagraphs(alternative.paragraphs);
  const transcript = (transcriptFromParagraphs ?? alternative.transcript ?? '').trim();

  const metadata = {
    model: extractModelName(payload.metadata),
    duration: payload.metadata?.duration,
    confidence: alternative.confidence,
    language: firstChannel?.detected_language,
    summary: extractSummary(alternative, payload.results)
  };

  return {
    transcript,
    metadata,
    rawResponse: payload
  };
};
