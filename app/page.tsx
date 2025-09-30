import Link from 'next/link';

export default function HomePage() {
  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          background: 'rgba(15, 23, 42, 0.55)',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}
      >
        <h2 style={{ marginBottom: '0.5rem' }}>Deepgram Transcription</h2>
        <p style={{ marginBottom: '1rem', color: '#cbd5f5' }}>
          Upload an audio file to receive a fast, high-quality transcript powered by Deepgram.
        </p>
        <Link
          href="/transcribe"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            color: '#0f172a',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Go to transcription
        </Link>
      </div>
    </section>
  );
}
