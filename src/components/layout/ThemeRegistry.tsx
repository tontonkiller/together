'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
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

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [evaMode, setEvaMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setEvaMode(true);
  }, []);

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
