'use client';

import { useState } from 'react';
import type { Lecture, LectureContent } from '../../lib/supabase/types';
import { createClient } from '../../lib/supabase/client';

interface FlashcardsViewProps {
  lecture: Lecture;
  content: LectureContent | undefined;
  onContentUpdate: (content: LectureContent) => void;
}

interface Flashcard {
  question: string;
  answer: string;
}

export function FlashcardsView({ lecture, content, onContentUpdate }: FlashcardsViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const supabase = createClient();

  const parseFlashcards = (contentData: any): Flashcard[] => {
    if (Array.isArray(contentData)) {
      return contentData;
    }

    if (typeof contentData === 'string') {
      // Parse markdown-style flashcards
      const cards: Flashcard[] = [];
      const lines = contentData.split('\n');
      let currentQuestion = '';
      let currentAnswer = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Q:') || trimmed.startsWith('**Q:**')) {
          if (currentQuestion && currentAnswer) {
            cards.push({ question: currentQuestion, answer: currentAnswer });
          }
          currentQuestion = trimmed.replace(/^\*?\*?Q:\*?\*?\s*/, '').trim();
          currentAnswer = '';
        } else if (trimmed.startsWith('A:') || trimmed.startsWith('**A:**')) {
          currentAnswer = trimmed.replace(/^\*?\*?A:\*?\*?\s*/, '').trim();
        }
      }

      if (currentQuestion && currentAnswer) {
        cards.push({ question: currentQuestion, answer: currentAnswer });
      }

      return cards;
    }

    return [];
  };

  const flashcards = content ? parseFlashcards(content.content) : [];

  const generateFlashcards = async () => {
    if (!lecture.transcript) {
      setError('No transcript available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          transcript: lecture.transcript,
          mode: 'flashcards'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate flashcards');

      // Save to database
      const { data: savedContent, error: dbError } = await supabase
        .from('lecture_content')
        .upsert({
          lecture_id: lecture.id,
          content_type: 'flashcards',
          content: data.output,
          provider
        })
        .select()
        .single();

      if (dbError) throw dbError;
      onContentUpdate(savedContent);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (!content && !isGenerating) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1.5rem',
          padding: '2rem'
        }}
      >
        <div style={{ fontSize: '4rem' }}>🃏</div>
        <h3 style={{ fontSize: '1.5rem', margin: 0 }}>No Flashcards Yet</h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '500px' }}>
          Generate study flashcards from your transcript. Perfect for reviewing key concepts and definitions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <div>
            <label
              htmlFor="provider-flashcards"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}
            >
              Choose AI Provider
            </label>
            <select
              id="provider-flashcards"
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic')}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-stronger)',
                background: 'var(--surface-input)',
                color: 'var(--text-secondary)',
                fontSize: '1rem'
              }}
            >
              <option value="openai">ChatGPT (OpenAI)</option>
              <option value="anthropic">Claude (Anthropic)</option>
            </select>
          </div>

          <button
            onClick={generateFlashcards}
            disabled={!lecture.transcript}
            style={{
              padding: '1rem 2rem',
              borderRadius: '999px',
              border: 'none',
              background: lecture.transcript ? 'var(--accent-gradient-alt)' : 'var(--accent-gradient-muted)',
              color: 'var(--accent-text-contrast)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: lecture.transcript ? 'pointer' : 'not-allowed'
            }}
          >
            Generate Flashcards
          </button>
        </div>

        {error && <p style={{ color: 'var(--status-error)', fontSize: '0.9rem' }}>{error}</p>}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--surface-panel-faint)',
            borderTop: '4px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Generating flashcards...
        </p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-error)' }}>
          No flashcards could be parsed. Try regenerating.
        </p>
        <button
          onClick={generateFlashcards}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent-gradient)',
            color: 'var(--accent-text-contrast)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Regenerate Flashcards
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Flashcards</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Card {currentIndex + 1} of {flashcards.length}
        </p>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          position: 'relative',
          height: '400px',
          cursor: 'pointer',
          perspective: '1000px',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: 'var(--accent-gradient)',
              borderRadius: '1rem',
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-panel)'
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem', opacity: 0.8 }}>
              QUESTION
            </div>
            <p
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                textAlign: 'center',
                margin: 0,
                color: 'var(--accent-text-contrast)'
              }}
            >
              {currentCard.question}
            </p>
            <div style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
              Click to reveal answer
            </div>
          </div>

          {/* Back */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: 'var(--surface-panel)',
              border: '1px solid var(--border-medium)',
              borderRadius: '1rem',
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-panel)',
              transform: 'rotateY(180deg)'
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                opacity: 0.8,
                color: 'var(--text-muted)'
              }}
            >
              ANSWER
            </div>
            <p
              style={{
                fontSize: '1.25rem',
                textAlign: 'center',
                margin: 0,
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}
            >
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          onClick={prevCard}
          disabled={flashcards.length <= 1}
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'var(--surface-panel)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            cursor: flashcards.length <= 1 ? 'not-allowed' : 'pointer',
            opacity: flashcards.length <= 1 ? 0.5 : 1
          }}
        >
          ← Previous
        </button>
        <button
          onClick={nextCard}
          disabled={flashcards.length <= 1}
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'var(--accent-gradient)',
            color: 'var(--accent-text-contrast)',
            fontWeight: 600,
            cursor: flashcards.length <= 1 ? 'not-allowed' : 'pointer',
            opacity: flashcards.length <= 1 ? 0.5 : 1
          }}
        >
          Next →
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button
          onClick={generateFlashcards}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-panel-faint)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          🔄 Regenerate
        </button>
      </div>
    </div>
  );
}
