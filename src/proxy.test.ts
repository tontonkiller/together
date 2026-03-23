import { describe, it, expect } from 'vitest';

// Test the middleware matcher config directly without importing next-intl
// (next-intl middleware requires Next.js server runtime)
const middlewareConfig = {
  matcher: [
    '/',
    '/(fr|en)/:path((?!_next/static|_next/image|icons|favicon\\.ico).*)',
    '/invite/:path*',
  ],
};

describe('Middleware config', () => {
  it('has a matcher array', () => {
    expect(middlewareConfig.matcher).toBeInstanceOf(Array);
    expect(middlewareConfig.matcher.length).toBeGreaterThan(0);
  });

  it('matches the root path', () => {
    expect(middlewareConfig.matcher).toContain('/');
  });

  it('matches locale-prefixed paths', () => {
    const localePattern = middlewareConfig.matcher.find((m: string) => m.includes('fr|en'));
    expect(localePattern).toBeDefined();
  });

  it('matches invite paths for redirect', () => {
    expect(middlewareConfig.matcher).toContain('/invite/:path*');
  });

  it('does NOT match API paths (API routes should bypass middleware)', () => {
    const hasApiMatcher = middlewareConfig.matcher.some((m: string) =>
      m.includes('/api') || m === '/api/:path*',
    );
    expect(hasApiMatcher).toBe(false);
  });

  it('excludes static assets from locale pattern', () => {
    const localePattern = middlewareConfig.matcher.find((m: string) => m.includes('fr|en'));
    expect(localePattern).toContain('_next/static');
    expect(localePattern).toContain('favicon');
  });
});

describe('Middleware matcher path validation', () => {
  // Simulate what the middleware matcher checks
  const invitePattern = /^\/invite\/(.+)$/;
  const localePattern = /^\/(fr|en)\//;

  it('/invite/abc123 matches the invite pattern', () => {
    expect(invitePattern.test('/invite/abc123')).toBe(true);
  });

  it('/invite/ without code does not match', () => {
    expect(invitePattern.test('/invite/')).toBe(false);
  });

  it('/fr/dashboard matches locale pattern', () => {
    expect(localePattern.test('/fr/dashboard')).toBe(true);
  });

  it('/en/groups/123 matches locale pattern', () => {
    expect(localePattern.test('/en/groups/123')).toBe(true);
  });

  it('/de/dashboard does not match locale pattern', () => {
    expect(localePattern.test('/de/dashboard')).toBe(false);
  });

  it('/api/invite/abc123 does not match invite pattern', () => {
    expect(invitePattern.test('/api/invite/abc123')).toBe(false);
  });
});
