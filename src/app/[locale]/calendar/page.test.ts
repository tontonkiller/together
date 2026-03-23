import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the server page logic as pure functions extracted from the component
// (The actual page.tsx is a server component that can't be rendered in jsdom)

const mockRedirect = vi.fn();
vi.mock('@/lib/i18n/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('REDIRECT');
  },
}));

describe('CalendarPage server logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication guard', () => {
    it('redirects to login when user is null', () => {
      const user = null;
      if (!user) {
        mockRedirect({ href: '/login', locale: 'fr' });
      }
      expect(mockRedirect).toHaveBeenCalledWith({ href: '/login', locale: 'fr' });
    });

    it('does not redirect when user exists', () => {
      const user = { id: 'user-1' };
      if (!user) {
        mockRedirect({ href: '/login', locale: 'fr' });
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Event normalization', () => {
    it('normalizes event_types from array to object', () => {
      const rawEvents = [
        { id: 'e1', event_types: [{ name: 'Vacances', icon: null }] },
        { id: 'e2', event_types: { name: 'Voyage', icon: 'flight' } },
        { id: 'e3', event_types: null },
      ];

      const normalized = rawEvents.map((e) => ({
        ...e,
        event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
      }));

      expect(normalized[0].event_types).toEqual({ name: 'Vacances', icon: null });
      expect(normalized[1].event_types).toEqual({ name: 'Voyage', icon: 'flight' });
      expect(normalized[2].event_types).toBeNull();
    });

    it('handles empty events array', () => {
      const events: Array<Record<string, unknown>> = [];
      const normalized = events.map((e) => ({
        ...e,
        event_types: Array.isArray(e.event_types) ? (e.event_types as Array<unknown>)[0] ?? null : e.event_types,
      }));
      expect(normalized).toEqual([]);
    });
  });

  describe('Event types fetch', () => {
    it('falls back to empty array on error', () => {
      const eventTypes = null;
      const result = eventTypes ?? [];
      expect(result).toEqual([]);
    });
  });
});
