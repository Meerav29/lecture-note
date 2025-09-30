'use client';

import { FormEvent, useMemo, useState } from 'react';

interface TranscriptResponse {
  transcript: string;
  metadata: {
    duration?: number;
    model?: string;
    confidence?: number;
  };
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);

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

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <article
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          boxShadow: '0 30px 70px rgba(15, 23, 42, 0.35)'
        }}
      >
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Transcribe audio with Deepgram</h2>
        <p style={{ marginBottom: '1.5rem', color: '#cbd5f5' }}>
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
              border: '2px dashed rgba(148, 163, 184, 0.4)',
              background: 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontWeight: 600 }}>Audio file</span>
            <span style={{ color: '#94a3b8' }}>{fileLabel}</span>
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
              }}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#0f172a',
              background: isSubmitting
                ? 'linear-gradient(135deg, #334155, #64748b)'
                : 'linear-gradient(135deg, #22d3ee, #6366f1)',
              transition: 'filter 150ms ease'
            }}
          >
            {isSubmitting ? 'Transcribing…' : 'Upload and transcribe'}
          </button>
        </form>

        {error && (
          <p role="alert" style={{ color: '#fca5a5', marginTop: '1rem' }}>
            {error}
          </p>
        )}
      </article>

      {result && (
        <article
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7
          }}
        >
          <header style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.35rem' }}>Transcript</h3>
            {metadataSummary && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{metadataSummary}</p>
            )}
          </header>
          {result.transcript || 'No transcript returned.'}
        </article>
      )}
    </section>
  );
}
