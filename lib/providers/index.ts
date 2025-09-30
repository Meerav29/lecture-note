import type { TranscriptionProvider } from '../types';
import { transcribeWithDeepgram } from './deepgram';

export const transcriptionProviders = {
  deepgram: transcribeWithDeepgram
} satisfies Record<string, TranscriptionProvider>;

export type TranscriptionProviderName = keyof typeof transcriptionProviders;

export const resolveTranscriptionProvider = (
  name?: string
): TranscriptionProvider => transcriptionProviders[name ?? 'deepgram'] ?? transcriptionProviders.deepgram;
