'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { defaultTheme, evaTheme } from '@/lib/theme';

interface EvaContextValue {
  evaMode: boolean;
  toggleEvaMode: () => void;
}

const EvaContext = createContext<EvaContextValue>({ evaMode: false, toggleEvaMode: () => {} });

export function useEvaMode() {
  return useContext(EvaContext);
}

const STORAGE_KEY = 'eva-mode';

function getStoredEvaMode() {
  return typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const storedEva = useSyncExternalStore(subscribeToStorage, getStoredEvaMode, () => false);
  const [evaMode, setEvaMode] = useState(storedEva);

  const toggleEvaMode = useCallback(() => {
    setEvaMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Keep theme-color meta tag in sync with active theme
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', evaMode ? '#C75B8F' : '#D4726A');
    }
  }, [evaMode]);

  const value = useMemo(() => ({ evaMode, toggleEvaMode }), [evaMode, toggleEvaMode]);

  return (
    <EvaContext.Provider value={value}>
      <ThemeProvider theme={evaMode ? evaTheme : defaultTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EvaContext.Provider>
  );
}
