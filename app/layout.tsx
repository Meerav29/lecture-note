import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

import { ThemeProvider } from '../components/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { AnonymousProvider } from '../contexts/AnonymousContext';
import { AppHeader } from '../components/layout/AppHeader';

export const metadata: Metadata = {
  title: 'Lecture Note - AI Utilities',
  description:
    'Upload lectures to generate transcripts and notes using Deepgram and other AI providers.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <ThemeProvider>
          <AuthProvider>
            <AnonymousProvider>
              <div className="background-glow" aria-hidden />
              <main className="app-shell">
                <AppHeader />
              {children}
              <footer className="app-footer">
                <p>
                  Built for students who want to listen first and organize later. Crafted with care by
                  the Lecture Note team.
                </p>
              </footer>
            </main>
            </AnonymousProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
