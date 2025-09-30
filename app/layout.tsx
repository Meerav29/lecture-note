import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lecture Note - AI Utilities',
  description:
    'Upload lectures to generate transcripts and notes using Deepgram and other AI providers.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Lecture Note</h1>
            <p style={{ color: '#94a3b8' }}>
              AI-powered tools to keep your lectures organized and accessible.
            </p>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
