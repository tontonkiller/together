'use client';

import { useEffect, useRef } from 'react';

/**
 * Make the OS / browser back button close an open Dialog instead of letting
 * it navigate away from the page.
 *
 * Why this exists: MUI's Dialog doesn't hook into the History API. In an
 * installed PWA on mobile, where the hardware back button is the only
 * "go back" affordance, hitting back while a Dialog is open caused the
 * underlying page to unmount entirely (taking the dialog with it). Users
 * perceived this as "back went two steps" — they expected the dialog to
 * close first.
 *
 * Mechanics:
 *   1. When `open` becomes true, push a marker history entry (same URL,
 *      just an extra entry the back button can consume).
 *   2. Listen for popstate. If it fires, the user pressed back — call
 *      onClose. The browser already popped the marker, so the page itself
 *      stays put.
 *   3. If `open` becomes false for any other reason (Save button,
 *      outside-click, Escape) we pop the marker ourselves so it doesn't
 *      sit in history pointing to a closed dialog.
 *
 * Limitation: nested dialogs would each push their own marker; popstate
 * is broadcast to every listener, so back would close all of them at once.
 * This app doesn't nest Dialogs, so it's a non-issue today.
 */
export function useBackButtonClose(open: boolean, onClose: () => void) {
  // Keep a ref so the popstate handler always sees the latest onClose
  // without us re-running the effect on every render. Update it in an effect
  // (not during render) so we never mutate a ref while rendering.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    if (typeof window === 'undefined') return;

    const marker = { __dialogMarker: true };
    window.history.pushState(marker, '');

    let closedByBack = false;

    function handlePopState() {
      closedByBack = true;
      onCloseRef.current();
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Dialog closed by something other than the back button — pop our
      // marker so the history doesn't accumulate stale entries.
      if (!closedByBack && (window.history.state as { __dialogMarker?: boolean } | null)?.__dialogMarker) {
        window.history.back();
      }
    };
  }, [open]);
}
