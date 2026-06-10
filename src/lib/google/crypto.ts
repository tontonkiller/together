/**
 * Encryption at rest for Google OAuth tokens.
 *
 * Refresh tokens are long-lived and grant ongoing access to a user's calendar,
 * so they must not sit in the database as plaintext. We use AES-256-GCM with a
 * 32-byte key supplied via the GOOGLE_TOKEN_ENCRYPTION_KEY env var (base64).
 *
 * Storage format: `gcm.v1.<iv>.<authTag>.<ciphertext>` (each part base64).
 *
 * Backward compatibility: `decryptToken` returns any value that lacks the
 * `gcm.v1.` prefix unchanged, so rows written before this change (plaintext)
 * keep working. Legacy plaintext refresh tokens are migrated to ciphertext
 * opportunistically the next time the account's token is refreshed (see
 * getAccessToken).
 *
 * The key is mandatory: both encrypt and decrypt throw when it's missing, so a
 * misconfigured environment fails loudly on the first Google operation instead
 * of silently writing plaintext that a correctly-configured instance can't read.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'gcm.v1.';

function getKey(): Buffer | null {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'GOOGLE_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (base64-encoded 256-bit key)',
    );
  }
  return key;
}

/** True if the stored value is already encrypted (vs. legacy plaintext). */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Encrypt a token for storage. Throws if GOOGLE_TOKEN_ENCRYPTION_KEY is not configured. */
export function encryptToken(plain: string): string {
  const key = getKey();
  if (!key) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is not set');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, ciphertext].map((b) => b.toString('base64')).join('.');
}

/** Decrypt a stored token. Values without the `gcm.v1.` prefix are treated as legacy plaintext. */
export function decryptToken(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const key = getKey();
  if (!key) {
    throw new Error(
      'Found an encrypted Google token but GOOGLE_TOKEN_ENCRYPTION_KEY is not set',
    );
  }
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split('.');
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error('Malformed encrypted token');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
