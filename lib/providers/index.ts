import type { TranscriptionProvider } from '../types';
import { transcribeWithDeepgram } from './deepgram';

export const transcriptionProviders = {
  deepgram: transcribeWithDeepgram
} satisfies Record<string, TranscriptionProvider>;

export type TranscriptionProviderName = keyof typeof transcriptionProviders;

const isKnownProvider = (value: string): value is TranscriptionProviderName =>
  Object.prototype.hasOwnProperty.call(transcriptionProviders, value);

export const resolveTranscriptionProvider = (name?: string): TranscriptionProvider => {
  const normalized = name?.toLowerCase() ?? 'deepgram';
  if (isKnownProvider(normalized)) {
    return transcriptionProviders[normalized];
  }
  return transcriptionProviders.deepgram;
};
