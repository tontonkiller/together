import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers before importing route
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock the Supabase server client
const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
      insert: mockInsert,
      upsert: mockUpsert,
    })),
  })),
}));

// Import after mocks
import { GET } from './route';

describe('Auth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { id: 'user-123' }, error: null });
    mockInsert.mockResolvedValue({ error: null });
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
    mockUpsert.mockResolvedValue({ error: null });

    const request = makeRequest('http://localhost/fr/auth/callback?code=abc123');
    await GET(request, makeParams('fr'));

    expect(mockUpsert).toHaveBeenCalled();
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
