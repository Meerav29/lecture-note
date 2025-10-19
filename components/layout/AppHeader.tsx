'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';

export function AppHeader() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="brand">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="brand-mark" aria-hidden>
            LN
          </span>
          <div>
            <h1>Lecture Note</h1>
            <p>AI-powered tools that help you capture, review, and share every lecture.</p>
          </div>
        </Link>
      </div>
      <div className="header-controls">
        <nav aria-label="Primary">
          {user && (
            <Link
              className="nav-link"
              href="/dashboard"
              style={{
                fontWeight: pathname === '/dashboard' ? 600 : 400
              }}
            >
              Dashboard
            </Link>
          )}
          <Link
            className="nav-link"
            href="/transcribe"
            style={{
              fontWeight: pathname === '/transcribe' ? 600 : 400
            }}
          >
            Transcribe
          </Link>
          {user && (
            <button
              onClick={() => signOut()}
              className="nav-link"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Sign Out
            </button>
          )}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
