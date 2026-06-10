import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/google/tokens';
import { encryptToken } from '@/lib/google/crypto';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { OAUTH_NONCE_COOKIE } from '@/lib/google/oauth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Parse state to get locale for redirect
  let locale: string = defaultLocale;
  let stateUserId: string | null = null;
  let stateNonce: string | null = null;
  try {
    const state = JSON.parse(stateParam ?? '{}');
    // Validate locale against the canonical list — it's reflected back through
    // Google and used to build redirect paths, so never trust it verbatim.
    if ((locales as readonly string[]).includes(state.locale)) {
      locale = state.locale;
    }
    stateUserId = state.userId ?? null;
    stateNonce = state.nonce ?? null;
  } catch {
    // ignore parse error
  }

  const profileUrl = `${url.origin}/${locale}/profile`;

  if (error || !code) {
    console.error('[google/callback] OAuth error:', error);
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }

  // CSRF protection: the state nonce must match the httpOnly cookie set when
  // this user started the connect flow. This is the real guard — an attacker
  // who only knows the victim's userId can't also forge the cookie. Consume the
  // cookie regardless so it can't be replayed.
  const cookieStore = await cookies();
  const expectedNonce = cookieStore.get(OAUTH_NONCE_COOKIE)?.value ?? null;
  cookieStore.delete(OAUTH_NONCE_COOKIE);

  if (!stateUserId || stateUserId !== user.id) {
    console.error('[google/callback] State user missing or mismatch');
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }

  if (!stateNonce || !expectedNonce || stateNonce !== expectedNonce) {
    console.error('[google/callback] OAuth state nonce missing or mismatch');
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }

  try {
    const redirectUri = `${url.origin}/api/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Get Google email from userinfo
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userinfoRes.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const userinfo = await userinfoRes.json();
    const googleEmail = userinfo.email as string;

    // Upsert google account (in case user reconnects same account)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Google only returns a refresh token on first consent. If it didn't send
    // one, preserve whatever is already stored instead of clobbering it with an
    // empty string (which would silently break future syncs).
    let refreshTokenColumn: string;
    if (tokens.refresh_token) {
      refreshTokenColumn = encryptToken(tokens.refresh_token);
    } else {
      const { data: existing } = await supabase
        .from('google_accounts')
        .select('refresh_token')
        .eq('user_id', user.id)
        .eq('google_email', googleEmail)
        .single();
      if (!existing?.refresh_token) {
        console.error('[google/callback] No refresh token returned and none stored');
        return NextResponse.redirect(`${profileUrl}?google=error`);
      }
      // Keep the stored value as-is (already encrypted / legacy plaintext).
      refreshTokenColumn = existing.refresh_token;
    }

    const { error: upsertError } = await supabase
      .from('google_accounts')
      .upsert(
        {
          user_id: user.id,
          google_email: googleEmail,
          refresh_token: refreshTokenColumn,
          access_token: encryptToken(tokens.access_token),
          token_expires_at: expiresAt,
        },
        { onConflict: 'user_id,google_email' },
      );

    if (upsertError) {
      console.error('[google/callback] Upsert failed:', upsertError.message);
      return NextResponse.redirect(`${profileUrl}?google=error`);
    }

    return NextResponse.redirect(`${profileUrl}?google=success`);
  } catch (err) {
    console.error('[google/callback] Token exchange failed:', err);
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }
}
