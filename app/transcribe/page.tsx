'use client';

import { ComponentProps, FormEvent, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type GenerationMode = 'notes' | 'flashcards' | 'mindmap';

type ProviderOption = 'openai' | 'anthropic';

interface TranscriptResponse {
  transcript: string;
  metadata: {
    duration?: number;
    model?: string;
    confidence?: number;
  };
}

interface GenerationResult {
  mode: GenerationMode;
  output: string;
}

const GENERATION_LABELS: Record<GenerationMode, string> = {
  notes: 'Generate class notes',
  flashcards: 'Generate flashcards',
  mindmap: 'Generate mind map'
};

const GENERATION_DESCRIPTIONS: Record<GenerationMode, string> = {
  notes: 'Create structured lecture notes with detailed explanations for each topic.',
  flashcards: 'Produce question and answer flashcards that cover the lecture highlights.',
  mindmap: 'Outline the lecture as a hierarchical mind map with nested bullet points.'
};

const PROVIDER_LABELS: Record<ProviderOption, string> = {
  openai: 'ChatGPT (OpenAI)',
  anthropic: 'Claude (Anthropic)'
};

const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      style={{
        fontSize: '1.45rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '0.9rem 0 0.5rem'
      }}
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        margin: '0.75rem 0 0.45rem'
      }}
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        margin: '0.6rem 0 0.35rem'
      }}
      {...props}
    />
  ),
  p: ({ node, ...props }) => (
    <p style={{ margin: '0.45rem 0', color: 'var(--text-soft-strong)', lineHeight: 1.55 }} {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul
      style={{
        margin: '0.5rem 0 0.5rem 1.1rem',
        padding: 0,
        color: 'var(--text-soft-strong)',
        lineHeight: 1.55,
        listStyleType: 'disc'
      }}
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      style={{
        margin: '0.5rem 0 0.5rem 1.1rem',
        padding: 0,
        color: 'var(--text-soft-strong)',
        lineHeight: 1.55,
        listStyleType: 'decimal'
      }}
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li style={{ marginBottom: '0.3rem' }} {...props} />,
  strong: ({ node, ...props }) => <strong style={{ color: 'var(--text-primary)' }} {...props} />,
  em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
  hr: () => (
    <hr
      style={{
        margin: '1rem 0',
        border: 0,
        borderTop: '1px solid var(--border-strong)'
      }}
    />
  ),
  code: ({ node, ...rest }) => {
    const { inline: isInline = false, ...codeProps } = rest as { inline?: boolean } & ComponentProps<'code'>;
    return (
      <code
        {...codeProps}
        style={{
          background: 'var(--surface-code)',
          borderRadius: '0.35rem',
          padding: isInline ? '0.1rem 0.35rem' : '0.6rem',
          display: isInline ? 'inline' : 'block',
          color: 'var(--text-code)',
          fontSize: isInline ? '0.95em' : '0.9rem',
          marginTop: isInline ? 0 : '0.4rem'
        }}
      />
    );
  }
};

const MarkdownOutput = ({ content }: { content: string }) => (
  <div style={{ color: 'var(--text-soft-strong)', fontSize: '1rem', lineHeight: 1.55 }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
);

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);

  const [provider, setProvider] = useState<ProviderOption>('openai');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<GenerationMode | null>(null);
  const [generations, setGenerations] = useState<GenerationResult[]>([]);

  const fileLabel = useMemo(() => {
    if (!file) return 'Choose an audio file';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} (${sizeMb} MB)`;
  }, [file]);

  const metadataSummary = useMemo(() => {
    if (!result) return '';

    return [
      result.metadata.model && `Model: ${result.metadata.model}`,
      result.metadata.duration && `Duration: ${result.metadata.duration.toFixed(2)}s`,
      typeof result.metadata.confidence === 'number' &&
        `Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`
    ]
      .filter((value): value is string => Boolean(value))
      .join(' • ');
  }, [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please select an audio file before uploading.');
      return;
    }

    setError(null);
    setGenerationError(null);
    setGenerations([]);
    setResult(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Transcription failed.');
      }

      const payload = (await response.json()) as TranscriptResponse;
      setResult(payload);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Unable to transcribe audio.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async (mode: GenerationMode) => {
    if (!result?.transcript) {
      setGenerationError('Transcribe audio before generating study materials.');
      return;
    }

    setGenerationError(null);
    setIsGenerating(mode);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          transcript: result.transcript,
          mode
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Generation failed.');
      }

      const output = typeof payload.output === 'string' ? payload.output.trim() : '';
      if (!output) {
        throw new Error('The language model returned an empty response.');
      }

      setGenerations((previous) => {
        const withoutMode = previous.filter((entry) => entry.mode !== mode);
        return [...withoutMode, { mode, output }];
      });
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Unable to generate the requested content.';
      setGenerationError(message);
    } finally {
      setIsGenerating(null);
    }
  };

  const getGeneration = (mode: GenerationMode) =>
    generations.find((entry) => entry.mode === mode)?.output ?? '';

  return (
    <section style={{ display: 'grid', gap: '1.5rem', marginBottom: '4rem' }}>
      <article
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-panel)'
        }}
      >
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Transcribe audio with Deepgram</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-soft-strong)' }}>
          Upload a pre-recorded lecture in MP3, WAV, or M4A format. Deepgram will process the entire
          file and return the transcript in a single response.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label
            htmlFor="audio"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '2px dashed var(--border-bold)',
              background: 'var(--surface-input)',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontWeight: 600 }}>Audio file</span>
            <span style={{ color: 'var(--text-muted)' }}>{fileLabel}</span>
            <input
              id="audio"
              name="file"
              type="file"
              accept="audio/*"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setResult(null);
                setError(null);
                setGenerations([]);
                setGenerationError(null);
              }}
              style={{ display: 'none' }}
            />
          </label>

          <div
            style={{
              display: 'grid',
              gap: '0.75rem',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-medium)',
              background: 'var(--surface-panel-faint)'
            }}
          >
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="provider" style={{ fontWeight: 600 }}>
                Choose language model
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value as ProviderOption)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-stronger)',
                  background: 'var(--surface-input)',
                  color: 'var(--text-secondary)'
                }}
              >
                {(Object.keys(PROVIDER_LABELS) as ProviderOption[]).map((option) => (
                  <option key={option} value={option}>
                    {PROVIDER_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Requests use the server-configured API key for your selected provider. Update
              `.env.local` to change the key used in this demo.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: 'var(--accent-text-contrast)',
              background: isSubmitting
                ? 'var(--accent-gradient-muted)'
                : 'var(--accent-gradient-alt)',
              transition: 'filter 150ms ease'
            }}
          >
            {isSubmitting ? 'Transcribing…' : 'Upload and transcribe'}
          </button>
        </form>

        {error && (
          <p role="alert" style={{ color: 'var(--status-error)', marginTop: '1rem' }}>
            {error}
          </p>
        )}
      </article>

      {result && (
        <article
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            background: 'var(--surface-panel-contrast)',
            border: '1px solid var(--border-default)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            display: 'grid',
            gap: '1.5rem'
          }}
        >
          <section>
            <header style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.35rem' }}>Transcript</h3>
              {metadataSummary && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{metadataSummary}</p>
              )}
            </header>
            <div style={{ color: 'var(--text-secondary)' }}>{result.transcript || 'No transcript returned.'}</div>
          </section>

          <section
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-panel-muted)',
              border: '1px solid var(--border-default)',
              display: 'grid',
              gap: '1rem'
            }}
          >
            <header>
              <h3 style={{ marginBottom: '0.35rem' }}>Create study materials</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Send the transcript to {PROVIDER_LABELS[provider]} with a tailored prompt to create
                notes, flashcards, or a mind map.
              </p>
            </header>

            <div
              style={{
                display: 'grid',
                gap: '0.75rem'
              }}
            >
              {(Object.keys(GENERATION_LABELS) as GenerationMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleGenerate(mode)}
                  disabled={isGenerating === mode}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-strong)',
                    background:
                      isGenerating === mode
                        ? 'var(--accent-gradient-muted)'
                        : 'var(--accent-gradient)',
                    color: 'var(--accent-text-contrast)',
                    fontWeight: 600,
                    cursor: isGenerating === mode ? 'wait' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.35rem',
                    textAlign: 'left'
                  }}
                >
                  <span>{isGenerating === mode ? 'Generating…' : GENERATION_LABELS[mode]}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent-text-contrast)' }}>
                    {GENERATION_DESCRIPTIONS[mode]}
                  </span>
                </button>
              ))}
            </div>

            {generationError && (
              <p role="alert" style={{ color: 'var(--status-error)' }}>
                {generationError}
              </p>
            )}
          </section>

          {(Object.keys(GENERATION_LABELS) as GenerationMode[])
            .map((mode) => ({ mode, output: getGeneration(mode) }))
            .filter((entry) => entry.output)
            .map((entry) => (
              <section
                key={entry.mode}
                style={{
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  background: 'var(--surface-panel-soft)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gap: '0.75rem'
                }}
              >
                <header>
                  <h3 style={{ marginBottom: '0.35rem' }}>{GENERATION_LABELS[entry.mode]}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {GENERATION_DESCRIPTIONS[entry.mode]}
                  </p>
                </header>
                <MarkdownOutput content={entry.output} />
              </section>
            ))}
        </article>
      )}
    </section>
  );
}
