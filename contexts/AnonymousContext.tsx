'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnonymousContextType {
  isAnonymous: boolean;
  setAnonymous: (value: boolean) => void;
  clearAnonymousData: () => void;
}

const AnonymousContext = createContext<AnonymousContextType | undefined>(undefined);

export function AnonymousProvider({ children }: { children: ReactNode }) {
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Check if user is in anonymous mode on mount
    const anonymousMode = sessionStorage.getItem('anonymousMode');
    if (anonymousMode === 'true') {
      setIsAnonymous(true);
    }
  }, []);

  const setAnonymous = (value: boolean) => {
    setIsAnonymous(value);
    if (value) {
      sessionStorage.setItem('anonymousMode', 'true');
    } else {
      sessionStorage.removeItem('anonymousMode');
    }
  };

  const clearAnonymousData = () => {
    sessionStorage.removeItem('anonymousMode');
    setIsAnonymous(false);
  };

  return (
    <AnonymousContext.Provider value={{ isAnonymous, setAnonymous, clearAnonymousData }}>
      {children}
    </AnonymousContext.Provider>
  );
}

export function useAnonymous() {
  const context = useContext(AnonymousContext);
  if (context === undefined) {
    throw new Error('useAnonymous must be used within an AnonymousProvider');
  }
  return context;
}
