import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshAccessToken, getGrantedScopes } from './tokens';

describe('refreshAccessToken', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns access_token + expires_at + null refresh_token when Google does not rotate', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: 'new-access',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar',
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const result = await refreshAccessToken('old-refresh');
    expect(result.access_token).toBe('new-access');
    expect(result.refresh_token).toBeNull();
    expect(result.expires_at).toBeInstanceOf(Date);
  });

  it('returns rotated refresh_token when Google provides one', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: 'new-access',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar',
          refresh_token: 'rotated-refresh',
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const result = await refreshAccessToken('old-refresh');
    expect(result.refresh_token).toBe('rotated-refresh');
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('{"error":"invalid_grant"}', { status: 400 }),
    ) as unknown as typeof fetch;

    await expect(refreshAccessToken('bad')).rejects.toThrow(/Token refresh failed/);
  });
});

describe('getGrantedScopes', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns parsed scope array', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const scopes = await getGrantedScopes('tok');
    expect(scopes).toEqual([
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
    ]);
  });

  it('returns null on non-ok response', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 400 })) as unknown as typeof fetch;
    expect(await getGrantedScopes('bad')).toBeNull();
  });

  it('returns null when scope field is missing', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
    expect(await getGrantedScopes('tok')).toBeNull();
  });

  it('returns null on fetch exception', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    expect(await getGrantedScopes('tok')).toBeNull();
  });
});
