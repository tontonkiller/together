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
 * keep working and get re-encrypted on the next write.
 *
 * If the env var is absent, encryption is a no-op (a warning is logged once).
 * This keeps the app functional in environments where the key hasn't been set
 * yet, while production should always configure it.
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

let warned = false;
function warnMissingKey() {
  if (!warned) {
    warned = true;
    console.warn(
      '[google/crypto] GOOGLE_TOKEN_ENCRYPTION_KEY not set — Google tokens are stored in plaintext. Set it in production.',
    );
  }
}

/** Encrypt a token for storage. Returns plaintext unchanged if no key is configured. */
export function encryptToken(plain: string): string {
  const key = getKey();
  if (!key) {
    warnMissingKey();
    return plain;
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
