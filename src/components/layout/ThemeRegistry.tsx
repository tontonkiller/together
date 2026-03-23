'use client';

import { createContext, useContext, useState, useCallback, useMemo, useSyncExternalStore } from 'react';
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
