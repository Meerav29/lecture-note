'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  ready: boolean;
  setTheme: (value: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'lecture-note-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initial: Theme = stored === 'light' || stored === 'dark' ? (stored as Theme) : prefersDark ? 'dark' : 'light';

    root.dataset.theme = initial;
    body.dataset.theme = initial;
    setThemeState(initial);
    setReady(true);

    if (stored === 'light' || stored === 'dark') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      const nextTheme: Theme = event.matches ? 'dark' : 'light';
      root.dataset.theme = nextTheme;
      body.dataset.theme = nextTheme;
      setThemeState(nextTheme);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = useCallback((value: Theme) => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    root.dataset.theme = value;
    body.dataset.theme = value;
    setThemeState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        const body = document.body;
        root.dataset.theme = next;
        body.dataset.theme = next;
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      ready,
      setTheme: applyTheme,
      toggleTheme
    }),
    [applyTheme, ready, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
