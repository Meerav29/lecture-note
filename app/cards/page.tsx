'use client';

import { ChangeEvent, useMemo, useState } from 'react';

import FlashcardDeck, { parseFlashcards } from '../../components/FlashcardDeck';

const SAMPLE_OUTPUT = [
  'Q: What is the central topic of the lecture?',
  'A: The talk explores how neural networks learn from labeled data.',
  'Q: Which metaphor explains gradient descent?',
  'A: It is compared to hiking down a valley while taking small, careful steps toward the floor.',
  'Q: Why does regular review matter for retention?',
  'A: Spaced repetition strengthens recall by revisiting material just before it would be forgotten.'
].join('\n');

export default function CardsPage() {
  const [rawCards, setRawCards] = useState<string>(SAMPLE_OUTPUT);

  const cards = useMemo(() => parseFlashcards(rawCards), [rawCards]);
  const cardCount = cards.length;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setRawCards(event.target.value);
  };

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
        <header style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Flashcard preview</h2>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Paste the flashcard bullets generated on the transcription page. Cards must use the
            Q: ... and A: ... format. Every answer is bundled with the next question so you can
            iterate through them below.
          </p>
        </header>

        <label style={{ display: 'grid', gap: '0.65rem' }}>
          <span style={{ fontWeight: 600 }}>
            Model output
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
              ({cardCount} parsed)
            </span>
          </span>
          <textarea
            value={rawCards}
            onChange={handleChange}
            rows={12}
            spellCheck={false}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-input)',
              color: 'var(--text-secondary)',
              fontFamily: 'Consolas, SFMono-Regular, ui-monospace, monospace',
              fontSize: '0.95rem',
              lineHeight: 1.5
            }}
          />
        </label>
      </article>

      <FlashcardDeck cards={cards} />
    </section>
  );
}
