'use client';

import { useMemo } from 'react';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme, ready } = useTheme();

  const { label, text } = useMemo(() => {
    if (!ready) {
      return { label: 'Loading theme preference', text: 'Theme' };
    }
    const next = theme === 'dark' ? 'light' : 'dark';
    const current = theme === 'dark' ? 'Dark mode' : 'Light mode';
    return { label: 'Switch to ' + next + ' mode', text: current };
  }, [ready, theme]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'light'}
      disabled={!ready}
    >
      <span className="theme-toggle-indicator" aria-hidden />
      <span className="theme-toggle-text" suppressHydrationWarning>
        {text}
      </span>
    </button>
  );
}
