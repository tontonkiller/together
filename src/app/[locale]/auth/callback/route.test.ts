import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers before importing route
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock Google tokens helpers
const mockGetGrantedScopes = vi.fn();
vi.mock('@/lib/google/tokens', () => ({
  GOOGLE_CALENDAR_SCOPE: 'https://www.googleapis.com/auth/calendar',
  getGrantedScopes: (...args: unknown[]) => mockGetGrantedScopes(...args),
}));

// Mock the Supabase server client
const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockProfilesUpsert = vi.fn();
const mockGoogleAccountsUpsert = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
      insert: mockInsert,
      upsert: table === 'google_accounts' ? mockGoogleAccountsUpsert : mockProfilesUpsert,
    })),
  })),
}));

// Import after mocks
import { GET } from './route';

describe('Auth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { id: 'user-123' }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockGoogleAccountsUpsert.mockResolvedValue({ error: null });
    mockGetGrantedScopes.mockResolvedValue([]);
    // Default fetch mock (tokeninfo / userinfo)
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('userinfo')) {
        return new Response(JSON.stringify({ email: 'test@gmail.com' }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as unknown as typeof fetch;
  });

  function makeRequest(url: string) {
    return new Request(url);
  }

  function makeParams(locale: string) {
    return { params: Promise.resolve({ locale }) };
  }

  it('redirects to login with error when no code is provided', async () => {
    const request = makeRequest('http://localhost/fr/auth/callback');
    const response = await GET(request, makeParams('fr'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/fr/login?error=auth');
  });

  it('exchanges code for session and redirects to dashboard', async () => {
    const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
    const response = await GET(request, makeParams('fr'));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/fr/dashboard');
  });

  it('redirects to login on code exchange failure', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: 'fail' } });

    const request = makeRequest('http://localhost/fr/auth/callback?code=bad');
    const response = await GET(request, makeParams('fr'));

    expect(response.headers.get('location')).toBe('http://localhost/fr/login?error=auth');
  });

  it('uses the next parameter for redirect', async () => {
    const request = makeRequest(
      'http://localhost/fr/auth/callback?code=abc123&next=/groups/123',
    );
    const response = await GET(request, makeParams('fr'));

    expect(response.headers.get('location')).toBe('http://localhost/fr/groups/123');
  });

  it('prevents open redirect with protocol-relative URLs', async () => {
    const request = makeRequest(
      'http://localhost/fr/auth/callback?code=abc123&next=//evil.com',
    );
    const response = await GET(request, makeParams('fr'));

    expect(response.headers.get('location')).toBe('http://localhost/fr/dashboard');
  });

  it('prevents open redirect with absolute URLs', async () => {
    const request = makeRequest(
      'http://localhost/fr/auth/callback?code=abc123&next=https://evil.com',
    );
    const response = await GET(request, makeParams('fr'));

    expect(response.headers.get('location')).toBe('http://localhost/fr/dashboard');
  });

  it('creates profile for new users', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null }); // no existing profile

    const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
    await GET(request, makeParams('fr'));

    expect(mockInsert).toHaveBeenCalledWith({
      id: 'user-123',
      display_name: 'test',
      avatar_url: null,
      preferred_locale: 'fr',
    });
  });

  it('extracts display name from email prefix', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'john.doe@gmail.com' } },
      error: null,
    });

    const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
    await GET(request, makeParams('fr'));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: 'john.doe' }),
    );
  });

  it('falls back to upsert if insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: { message: 'duplicate' } });
    mockProfilesUpsert.mockResolvedValue({ error: null });

    const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
    await GET(request, makeParams('fr'));

    expect(mockProfilesUpsert).toHaveBeenCalled();
  });

  describe('Google provider tokens', () => {
    const withGoogleSession = () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          session: {
            provider_token: 'google-access-token',
            provider_refresh_token: 'google-refresh-token',
          },
        },
        error: null,
      });
    };

    it('upserts google_accounts with calendar_granted=true when Calendar scope is present', async () => {
      withGoogleSession();
      mockGetGrantedScopes.mockResolvedValue([
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar',
      ]);

      const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
      await GET(request, makeParams('fr'));

      expect(mockGoogleAccountsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          google_email: 'test@gmail.com',
          refresh_token: 'google-refresh-token',
          access_token: 'google-access-token',
          calendar_granted: true,
        }),
        { onConflict: 'user_id,google_email' },
      );
    });

    it('upserts with calendar_granted=false when user unchecked Calendar', async () => {
      withGoogleSession();
      mockGetGrantedScopes.mockResolvedValue(['openid', 'email', 'profile']);

      const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
      await GET(request, makeParams('fr'));

      expect(mockGoogleAccountsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ calendar_granted: false }),
        { onConflict: 'user_id,google_email' },
      );
    });

    it('skips google_accounts upsert for magic-link sign-ins (no provider tokens)', async () => {
      // Default session is null — no provider tokens
      const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
      await GET(request, makeParams('fr'));

      expect(mockGoogleAccountsUpsert).not.toHaveBeenCalled();
    });

    it('does not block login on google_accounts upsert failure', async () => {
      withGoogleSession();
      mockGetGrantedScopes.mockResolvedValue([
        'https://www.googleapis.com/auth/calendar',
      ]);
      mockGoogleAccountsUpsert.mockResolvedValue({ error: { message: 'db down' } });

      const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
      const response = await GET(request, makeParams('fr'));

      // User still reaches dashboard — banner will prompt to reconnect later
      expect(response.headers.get('location')).toBe('http://localhost/fr/dashboard');
    });

    it('does not block login when userinfo fetch fails', async () => {
      withGoogleSession();
      mockGetGrantedScopes.mockResolvedValue([
        'https://www.googleapis.com/auth/calendar',
      ]);
      globalThis.fetch = vi.fn(async () => new Response('error', { status: 500 })) as unknown as typeof fetch;

      const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
      const response = await GET(request, makeParams('fr'));

      expect(mockGoogleAccountsUpsert).not.toHaveBeenCalled();
      expect(response.headers.get('location')).toBe('http://localhost/fr/dashboard');
    });
  });

  it('falls back to default locale for invalid locale param', async () => {
    const request = makeRequest('http://localhost/de/auth/callback?code=abc123');
    const response = await GET(request, makeParams('de'));

    // Should use 'fr' as default
    expect(response.headers.get('location')).toBe('http://localhost/fr/dashboard');
  });

  it('uses en locale when specified', async () => {
    const request = makeRequest('http://localhost/en/auth/callback?code=abc123');
    const response = await GET(request, makeParams('en'));

    expect(response.headers.get('location')).toBe('http://localhost/en/dashboard');
  });
});
