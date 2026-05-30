import { describe, it, expect, vi, afterEach } from 'vitest';
import { rateLimit } from './rateLimit';

afterEach(() => {
  vi.useRealTimers();
});

describe('rateLimit', () => {
  it('allows requests up to the limit then blocks', () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 3, 1000).ok).toBe(true);
    expect(rateLimit(key, 3, 1000).ok).toBe(true);
    expect(rateLimit(key, 3, 1000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 1000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 1, 1000).ok).toBe(true);
    expect(rateLimit(key, 1, 1000).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 1, 1000).ok).toBe(true);
  });

  it('tracks separate keys independently', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 1000).ok).toBe(true);
    expect(rateLimit(a, 1, 1000).ok).toBe(false);
    expect(rateLimit(b, 1, 1000).ok).toBe(true);
  });
});
