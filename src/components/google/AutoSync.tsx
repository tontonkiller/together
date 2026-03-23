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

    localStorage.setItem(STORAGE_KEY, String(now));

    // Fire and forget — don't block the UI
    fetch('/api/google/sync', { method: 'POST' }).catch(() => {
      // Silently fail — user can manually sync from the page
    });
  }, []);

  return null;
}
