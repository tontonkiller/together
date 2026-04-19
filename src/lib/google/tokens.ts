/**
 * Google OAuth token management.
 * Handles token refresh and provides valid access tokens for API calls.
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

/**
 * Refresh an access token using a refresh token.
 * Google can rotate the refresh token on any refresh call — if a new one is
 * returned, it must be persisted by the caller (old one becomes invalid).
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_at: Date; refresh_token: string | null }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data: TokenResponse = await res.json();
  const expires_at = new Date(Date.now() + data.expires_in * 1000);

  return {
    access_token: data.access_token,
    expires_at,
    refresh_token: data.refresh_token ?? null,
  };
}

/**
 * Inspect a Google access token to know which scopes the user granted.
 * Uses Google's tokeninfo endpoint — handles granular consent correctly.
 * Returns null if the token is invalid or the call fails.
 */
export async function getGrantedScopes(accessToken: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { scope?: string };
    if (typeof data.scope !== 'string') return null;
    return data.scope.split(' ').filter(Boolean);
  } catch {
    return null;
  }
}

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

/**
 * Build the Google OAuth authorization URL.
 */
export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
