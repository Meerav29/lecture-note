'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';

const highlights = [
  {
    title: 'Lightning-fast transcription',
    description:
      'Upload lectures or study groups and get beautifully formatted transcripts within minutes.',
    href: '/transcribe',
    cta: 'Start transcribing'
  },
  {
    title: 'Instant study notes',
    description:
      'Convert transcripts into organized summaries, key takeaways, and follow-up questions.',
    href: '/notes',
    cta: 'Generate notes'
  },
  {
    title: 'Build smarter flashcards',
    description:
      'Turn lectures into spaced-repetition decks so revision nights actually stick.',
    href: '/cards',
    cta: 'Open flashcards'
  }
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <section className="hero">
        <span className="hero-pill">New • Record & Transcribe</span>
        <h2>Capture every lecture, stay in the flow.</h2>
        <p>
          Bring your audio, Lecture Note handles the rest. Transcribe, summarize, and revise with a
          calm workspace designed for students who learn better when they can focus on listening.
        </p>
        <div className="hero-actions">
          {!loading && (
            <>
              {user ? (
                <Link className="button primary" href="/dashboard">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <button
                    className="button primary"
                    onClick={() => setShowAuthModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    Sign In / Sign Up
                  </button>
                  <Link
                    className="button secondary"
                    href="/dashboard/new?mode=record&guest=true"
                  >
                    Try Without Account
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        {!loading && !user && (
          <p className="hero-subtext">
            <strong>Sign in</strong> to save your lectures and access them anywhere.
            Or <strong>try as guest</strong> — no data will be saved.
          </p>
        )}
        <div className="hero-meta">
          <div>
            <span className="meta-number">4.8★</span>
            <span className="meta-label">Student satisfaction</span>
          </div>
          <div>
            <span className="meta-number">1.2k+</span>
            <span className="meta-label">Lectures transcribed last month</span>
          </div>
          <div>
            <span className="meta-number">∞</span>
            <span className="meta-label">Focus regained</span>
          </div>
        </div>
      </section>

      <section className="highlights" aria-label="Workflow shortcuts">
        {highlights.map((item) => (
          <article className="glass-card" key={item.title}>
            <div className="card-header">
              <h3>{item.title}</h3>
              <Link className="icon-link" href={item.href}>
                <span>{item.cta}</span>
                <span aria-hidden>→</span>
              </Link>
            </div>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="info-grid">
        <article className="info-card">
          <h3>Stay organized effortlessly</h3>
          <p>
            Drop in your lecture recordings and Lecture Note syncs transcripts, notes, and flashcards
            automatically. Everything lives in one tidy dashboard that looks good at 2 a.m. study
            sessions and 9 a.m. lectures alike.
          </p>
        </article>
        <article className="info-card">
          <h3>Designed for real student life</h3>
          <p>
            Dark, calming visuals, keyboard-friendly shortcuts, and smart defaults make it easy to
            stay in the zone. Less fiddling, more learning.
          </p>
        </article>
        <article className="info-card">
          <h3>Collaborate when it counts</h3>
          <p>
            Share notes with classmates, export summaries to slides, or keep it private for your own
            revision. You control how your lecture knowledge travels.
          </p>
        </article>
      </section>
    </>
  );
}
