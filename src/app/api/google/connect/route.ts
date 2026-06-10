import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { buildGoogleAuthUrl } from '@/lib/google/tokens';
import { OAUTH_NONCE_COOKIE } from '@/lib/google/oauth';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { locale } = await request.json().catch(() => ({ locale: 'fr' }));

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/google/callback`;

  // State encodes user ID + locale, plus a random nonce that we also set as an
  // httpOnly cookie. The callback requires the two to match, which makes the
  // state a real CSRF token (an attacker can't both set the victim's cookie and
  // craft a matching state) instead of just a forgeable userId echo.
  const nonce = randomBytes(16).toString('hex');
  const state = JSON.stringify({ userId: user.id, locale, nonce });
  const authUrl = buildGoogleAuthUrl(redirectUri, state);

  const response = NextResponse.json({ url: authUrl });
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes — the OAuth round-trip is short-lived
  });
  return response;
}
