import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/google/tokens';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Parse state to get locale for redirect
  let locale = 'fr';
  let stateUserId: string | null = null;
  try {
    const state = JSON.parse(stateParam ?? '{}');
    locale = state.locale ?? 'fr';
    stateUserId = state.userId ?? null;
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

  // Verify state matches current user
  if (stateUserId && stateUserId !== user.id) {
    console.error('[google/callback] State user mismatch');
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

    const { error: upsertError } = await supabase
      .from('google_accounts')
      .upsert(
        {
          user_id: user.id,
          google_email: googleEmail,
          refresh_token: tokens.refresh_token ?? '',
          access_token: tokens.access_token,
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
