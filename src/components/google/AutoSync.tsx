'use client';

import { useEffect } from 'react';

const SYNC_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'google_last_sync_at';

/**
 * Auto-triggers Google Calendar sync on app open.
 * Debounces to avoid syncing more than once every 5 minutes.
 * Only renders if the user has Google accounts connected.
 */
export default function AutoSync() {
  useEffect(() => {
    const lastSync = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastSync && now - Number(lastSync) < SYNC_DEBOUNCE_MS) {
      return; // Too soon, skip
    }

    // Defer until the browser is idle so it never competes with first paint
    // or hydration of the page the user just navigated to.
    const run = () => {
      localStorage.setItem(STORAGE_KEY, String(now));
      fetch('/api/google/sync', { method: 'POST' }).catch(() => {
        // Silently fail — user can manually sync from the page
      });
    };

    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (typeof ric === 'function') {
      const handle = ric(run, { timeout: 3000 });
      return () => {
        const cic = (window as Window & { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback;
        if (typeof cic === 'function') cic(handle);
      };
    }

    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
