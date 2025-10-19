'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        // Success! Close modal and redirect to dashboard
        onClose();
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'var(--surface-panel)',
          borderRadius: '1rem',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-panel)',
          width: '100%',
          maxWidth: '420px',
          padding: '2rem',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            lineHeight: 1,
            padding: '0.5rem'
          }}
        >
          ×
        </button>

        {/* Header */}
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', marginTop: 0 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {mode === 'signin'
            ? 'Sign in to access your lectures and notes'
            : 'Get started with Lecture Note for free'}
        </p>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            padding: '0.25rem',
            background: 'var(--surface-panel-faint)',
            borderRadius: '0.5rem'
          }}
        >
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.35rem',
              background: mode === 'signin' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'signin' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.35rem',
              background: mode === 'signup' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'signup' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-stronger)',
                background: 'var(--surface-input)',
                color: 'var(--text-secondary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-stronger)',
                background: 'var(--surface-input)',
                color: 'var(--text-secondary)',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: 'var(--status-error)',
                margin: 0,
                fontSize: '0.9rem',
                padding: '0.75rem',
                background: 'rgba(252, 165, 165, 0.1)',
                borderRadius: '0.5rem'
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.875rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--accent-text-contrast)',
              background: loading ? 'var(--accent-gradient-muted)' : 'var(--accent-gradient-alt)',
              transition: 'filter 150ms ease',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'signup' && (
          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}
          >
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  );
}
