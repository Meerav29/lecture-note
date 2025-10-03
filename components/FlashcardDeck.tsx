'use client';

import { useEffect, useMemo, useState } from 'react';

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  tags?: string[];
}

interface FlashcardDeckProps {
  cards: Flashcard[];
}

const trimLines = (lines: string[]) => {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const formatBlock = (lines: string[]) => {
  if (!lines.length) return '';
  const cleaned = trimLines(lines).join('\n');
  return cleaned.replace(/\n{3,}/g, '\n\n');
};

export const parseFlashcards = (input: string): Flashcard[] => {
  const cards: Flashcard[] = [];
  let working: { question: string[]; answer: string[] } | null = null;
  let mode: 'question' | 'answer' | null = null;

  const pushCurrent = () => {
    if (!working) return;
    const question = formatBlock(working.question);
    const answer = formatBlock(working.answer);
    if (question && answer) {
      cards.push({ id: cards.length + 1, question, answer });
    }
    working = null;
    mode = null;
  };

  const lines = input.replace(/\r\n/g, '\n').split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const qMatch = trimmed.match(/^q\s*[:\-]\s*(.*)$/i);
    if (qMatch) {
      if (working) pushCurrent();
      working = { question: [qMatch[1].trim()], answer: [] };
      mode = 'question';
      continue;
    }

    const aMatch = trimmed.match(/^a\s*[:\-]\s*(.*)$/i);
    if (aMatch) {
      if (!working) {
        working = { question: [], answer: [] };
      }
      working.answer.push(aMatch[1].trim());
      mode = 'answer';
      continue;
    }

    if (!working || !mode) continue;

    if (mode === 'question') {
      working.question.push(trimmed);
    } else {
      working.answer.push(trimmed);
    }
  }

  pushCurrent();
  return cards;
};

const FlashcardDeck = ({ cards }: FlashcardDeckProps) => {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setIndex(0);
    setShowAnswer(false);
  }, [cards]);

  const totalCards = cards.length;
  const hasCards = totalCards > 0;
  const currentCard = hasCards ? cards[index] : null;

  const progressLabel = useMemo(() => {
    if (!hasCards) return '0 / 0';
    return String(index + 1) + ' / ' + String(totalCards);
  }, [hasCards, index, totalCards]);

  const handlePrevious = () => {
    if (!hasCards) return;
    setShowAnswer(false);
    setIndex((prev) => {
      if (prev === 0) return totalCards - 1;
      return prev - 1;
    });
  };

  const handleNext = () => {
    if (!hasCards) return;
    setShowAnswer(false);
    setIndex((prev) => (prev + 1) % totalCards);
  };

  const faceContent = showAnswer ? currentCard?.answer : currentCard?.question;

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-strong)',
        background: 'var(--surface-panel-muted)'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Preview</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{progressLabel}</span>
      </header>

      {!hasCards ? (
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Paste model output using the Q: … / A: … format to preview flashcards here.
        </p>
      ) : (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-default)',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {showAnswer ? 'Answer' : 'Prompt'}
            </span>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.6 }}>
              {faceContent || '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAnswer((prev) => !prev)}
            style={{
              alignSelf: 'flex-start',
              padding: '0.65rem 1.25rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              color: 'var(--accent-text-contrast)',
              background: 'var(--accent-gradient-alt)'
            }}
          >
            {showAnswer ? 'Hide answer' : 'Reveal answer'}
          </button>
        </div>
      )}

      {hasCards && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handlePrevious}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-medium)',
              background: 'var(--surface-panel)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-medium)',
              background: 'var(--surface-panel)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;
