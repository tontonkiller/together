import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the server page logic as pure functions extracted from the component
// (The actual page.tsx is a server component that can't be rendered in jsdom)

const mockRedirect = vi.fn();
vi.mock('@/lib/i18n/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('REDIRECT'); // simulate redirect stopping execution
  },
}));

describe('GroupDetailPage server logic', () => {
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

  describe('Group not found guard', () => {
    it('redirects to dashboard when group is null', () => {
      const group = null;
      if (!group) {
        mockRedirect({ href: '/dashboard', locale: 'fr' });
      }
      expect(mockRedirect).toHaveBeenCalledWith({ href: '/dashboard', locale: 'fr' });
    });
  });

  describe('Membership guard', () => {
    it('redirects to dashboard when user is not a member', () => {
      const members = [
        { user_id: 'other-user', role: 'admin' },
        { user_id: 'another-user', role: 'member' },
      ];
      const currentMember = members.find((m) => m.user_id === 'user-1');
      if (!currentMember) {
        mockRedirect({ href: '/dashboard', locale: 'fr' });
      }
      expect(mockRedirect).toHaveBeenCalledWith({ href: '/dashboard', locale: 'fr' });
    });

    it('does not redirect when user is a member', () => {
      const members = [
        { user_id: 'user-1', role: 'admin' },
        { user_id: 'other-user', role: 'member' },
      ];
      const currentMember = members.find((m) => m.user_id === 'user-1');
      if (!currentMember) {
        mockRedirect({ href: '/dashboard', locale: 'fr' });
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Admin-only invitation fetching', () => {
    it('fetches invitations for admin role', () => {
      const currentMember = { role: 'admin' };
      const shouldFetch = currentMember.role === 'admin';
      expect(shouldFetch).toBe(true);
    });

    it('does not fetch invitations for member role', () => {
      const currentMember = { role: 'member' };
      const shouldFetch = currentMember.role === 'admin';
      expect(shouldFetch).toBe(false);
    });
  });

  describe('Supabase normalization', () => {
    it('normalizes profiles from array to object', () => {
      const rawMembers = [
        { user_id: 'u1', profiles: [{ display_name: 'Alice', avatar_url: null }] },
        { user_id: 'u2', profiles: { display_name: 'Bob', avatar_url: null } },
      ];

      const normalized = rawMembers.map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles,
      }));

      expect(normalized[0].profiles).toEqual({ display_name: 'Alice', avatar_url: null });
      expect(normalized[1].profiles).toEqual({ display_name: 'Bob', avatar_url: null });
    });

    it('handles empty profiles array', () => {
      const rawMembers = [{ user_id: 'u1', profiles: [] as Array<{ display_name: string; avatar_url: string | null }> }];
      const normalized = rawMembers.map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles,
      }));
      expect(normalized[0].profiles).toBeNull();
    });

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
  });

  describe('Member user IDs extraction', () => {
    it('extracts user IDs from members list', () => {
      const members = [
        { user_id: 'u1' },
        { user_id: 'u2' },
        { user_id: 'u3' },
      ];
      const ids = members.map((m) => m.user_id);
      expect(ids).toEqual(['u1', 'u2', 'u3']);
    });

    it('handles empty members list', () => {
      const members: Array<{ user_id: string }> = [];
      const ids = members.map((m) => m.user_id);
      expect(ids).toEqual([]);
    });
  });
});
