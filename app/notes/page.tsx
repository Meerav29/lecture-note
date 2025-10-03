export default function NotesPage() {
  return (
    <section style={{ display: 'grid', gap: '1.5rem', marginBottom: '4rem' }}>
      <article
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-panel)'
        }}
      >
        <header style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Lecture notes workspace</h2>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Generate polished lecture notes from any transcript. Start from the transcription
            workflow, then paste the resulting markdown below to keep a persistent copy or make
            edits before sharing.
          </p>
        </header>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <section
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-panel-muted)',
              border: '1px solid var(--border-default)'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Suggested flow</h3>
            <ol style={{ margin: '0.75rem 0 0 1.25rem', color: 'var(--text-soft-strong)', lineHeight: 1.6 }}>
              <li>Upload or record on the Transcribe page and wait for the transcript.</li>
              <li>Select “Generate class notes” to receive a structured markdown outline.</li>
              <li>Paste the response into your favourite editor or the text area below.</li>
            </ol>
          </section>

          <section
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-panel-muted)',
              border: '1px solid var(--border-default)'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Formatting tips</h3>
            <ul style={{ margin: '0.75rem 0 0 1.25rem', color: 'var(--text-soft-strong)', lineHeight: 1.6 }}>
              <li>Use headings to separate major topics and reinforce transitions.</li>
              <li>Add callouts for definitions, diagrams, and next-step readings.</li>
              <li>Create summary bullets to unlock flashcard-ready content later.</li>
            </ul>
          </section>
        </div>
      </article>
    </section>
  );
}
