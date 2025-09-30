import type { Buffer } from 'node:buffer';

export type SummarizationSetting = boolean | 'v2' | 'conversational' | string;

export interface TranscriptionOptions {
  model?: string;
  language?: string;
  summarize?: SummarizationSetting;
  diarize?: boolean;
  paragraphs?: boolean;
  smartFormat?: boolean;
  punctuate?: boolean;
}

export interface TranscriptionRequest {
  audio: Buffer;
  mimeType?: string;
  apiKey?: string;
  options?: TranscriptionOptions;
}

export interface TranscriptionMetadata {
  model?: string;
  duration?: number;
  confidence?: number;
  language?: string;
  summary?: string;
}

export interface TranscriptionResult {
  transcript: string;
  metadata: TranscriptionMetadata;
  rawResponse?: unknown;
}

export type TranscriptionProvider = (request: TranscriptionRequest) => Promise<TranscriptionResult>;
