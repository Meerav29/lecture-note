import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lecture Note - AI Utilities',
  description:
    'Upload lectures to generate transcripts and notes using Deepgram and other AI providers.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="background-glow" aria-hidden />
        <main className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="brand-mark" aria-hidden>
                LN
              </span>
              <div>
                <h1>Lecture Note</h1>
                <p>AI-powered tools that help you capture, review, and share every lecture.</p>
              </div>
            </div>
            <nav aria-label="Primary">
              <Link className="nav-link" href="/transcribe">
                Transcribe
              </Link>
              <Link className="nav-link" href="/notes">
                Notes
              </Link>
              <Link className="nav-link" href="/cards">
                Flashcards
              </Link>
              <Link className="nav-link" href="/docs">
                Docs
              </Link>
            </nav>
          </header>
          {children}
          <footer className="app-footer">
            <p>
              Built for students who want to listen first and organize later. Crafted with care by
              the Lecture Note team.
            </p>
          </footer>
        </main>
      </body>
    </html>
  );
}
