/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET } from './route';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: string) => ({ redirectUrl: url }),
  },
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

// ── Helpers ─────────────────────────────────────────────────────────────────

const ORIGIN = 'https://example.com';

function makeRequest(
  locale: string,
  query: Record<string, string> = {},
): [Request, { params: Promise<{ locale: string }> }] {
  const url = new URL(`${ORIGIN}/${locale}/auth/callback`);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  return [
    new Request(url.toString()),
    { params: Promise.resolve({ locale }) },
  ];
}

function mockSupabase(overrides: {
  exchangeCodeForSession?: { error: { message: string } | null };
  getUser?: { data: { user: { id: string; email?: string } | null } };
  profileSelect?: { data: { id: string } | null };
  profileInsert?: { error: { message: string } | null };
  profileUpsert?: { error: { message: string } | null };
} = {}) {
  const {
    exchangeCodeForSession = { error: null },
    getUser = { data: { user: { id: 'u1', email: 'alice@test.com' } } },
    profileSelect = { data: null },
    profileInsert = { error: null },
    profileUpsert = { error: null },
  } = overrides;

  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(profileSelect),
    insert: vi.fn().mockResolvedValue(profileInsert),
    upsert: vi.fn().mockResolvedValue(profileUpsert),
  };

  const client = {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(exchangeCodeForSession),
      getUser: vi.fn().mockResolvedValue(getUser),
    },
    from: vi.fn().mockReturnValue(chainable),
  };

  vi.mocked(createClient).mockResolvedValue(client as any);
  return { client, chainable };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GET /[locale]/auth/callback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Open redirect prevention
  describe('open redirect prevention', () => {
    it('rewrites next=//evil.com to /dashboard', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('fr', { code: 'c1', next: '//evil.com' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/fr/dashboard`);
    });

    it('rewrites next=https://evil.com to /dashboard', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('fr', { code: 'c1', next: 'https://evil.com' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/fr/dashboard`);
    });

    it('preserves a valid relative next=/settings', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('fr', { code: 'c1', next: '/settings' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/fr/settings`);
    });
  });

  // 2. Locale validation
  describe('locale validation', () => {
    it('falls back to default locale for unknown locale "de"', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('de', { code: 'c1' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/fr/dashboard`);
    });

    it('preserves known locale "en"', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('en', { code: 'c1' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/en/dashboard`);
    });
  });

  // 3. No code param
  describe('no code param', () => {
    it('redirects to /{locale}/login?error=auth when code is missing', async () => {
      const res: any = await GET(...makeRequest('fr', {}));
      expect(res.redirectUrl).toBe(`${ORIGIN}/fr/login?error=auth`);
    });
  });

  // 4. Code exchange failure
  describe('code exchange failure', () => {
    it('redirects to login with ?error=auth on exchange error', async () => {
      mockSupabase({
        exchangeCodeForSession: { error: { message: 'bad code' } },
      });
      const res: any = await GET(...makeRequest('en', { code: 'bad' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/en/login?error=auth`);
    });
  });

  // 5. Profile creation happy path
  describe('profile creation happy path', () => {
    it('inserts a profile when none exists', async () => {
      const { client, chainable } = mockSupabase({
        profileSelect: { data: null },
        profileInsert: { error: null },
      });

      await GET(...makeRequest('en', { code: 'c1' }));

      // from('profiles') is called for the select and the insert
      expect(client.from).toHaveBeenCalledWith('profiles');
      expect(chainable.insert).toHaveBeenCalledWith({
        id: 'u1',
        display_name: 'alice',
        preferred_locale: 'en',
      });
    });

    it('does not insert when profile already exists', async () => {
      const { chainable } = mockSupabase({
        profileSelect: { data: { id: 'u1' } },
      });

      await GET(...makeRequest('en', { code: 'c1' }));

      expect(chainable.insert).not.toHaveBeenCalled();
    });
  });

  // 6. Profile insert race → upsert retry
  describe('profile insert race, upsert retry', () => {
    it('calls upsert when insert fails', async () => {
      const { chainable } = mockSupabase({
        profileSelect: { data: null },
        profileInsert: { error: { message: 'duplicate key' } },
        profileUpsert: { error: null },
      });

      await GET(...makeRequest('fr', { code: 'c1' }));

      expect(chainable.insert).toHaveBeenCalled();
      expect(chainable.upsert).toHaveBeenCalledWith({
        id: 'u1',
        display_name: 'alice',
        preferred_locale: 'fr',
      });
    });
  });

  // 7. Redirect URL shape
  describe('redirect URL shape', () => {
    it('builds redirect as {origin}/{locale}{safePath}', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('en', { code: 'c1', next: '/profile/me' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/en/profile/me`);
    });

    it('defaults safePath to /dashboard when next is absent', async () => {
      mockSupabase();
      const res: any = await GET(...makeRequest('fr', { code: 'c1' }));
      expect(res.redirectUrl).toBe(`${ORIGIN}/fr/dashboard`);
    });
  });
});
