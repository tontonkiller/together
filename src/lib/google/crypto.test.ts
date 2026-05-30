import { describe, it, expect, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { encryptToken, decryptToken } from './crypto';

const KEY = randomBytes(32).toString('base64');

afterEach(() => {
  delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
});

describe('token crypto', () => {
  it('round-trips a token when a key is configured', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = KEY;
    const plain = 'ya29.super-secret-refresh-token';
    const enc = encryptToken(plain);
    expect(enc).toMatch(/^gcm\.v1\./);
    expect(enc).not.toContain(plain);
    expect(decryptToken(enc)).toBe(plain);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = KEY;
    expect(encryptToken('same')).not.toBe(encryptToken('same'));
  });

  it('treats unprefixed values as legacy plaintext on decrypt', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = KEY;
    expect(decryptToken('legacy-plaintext-token')).toBe('legacy-plaintext-token');
  });

  it('is a no-op when no key is configured', () => {
    const plain = 'no-key-here';
    expect(encryptToken(plain)).toBe(plain);
    expect(decryptToken(plain)).toBe(plain);
  });

  it('rejects a key that is not 32 bytes', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');
    expect(() => encryptToken('x')).toThrow();
  });

  it('fails to decrypt an encrypted value once the key is removed', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = KEY;
    const enc = encryptToken('secret');
    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    expect(() => decryptToken(enc)).toThrow();
  });
});
