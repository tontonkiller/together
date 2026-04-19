import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale, locales } from '@/lib/i18n/config';
import { GOOGLE_CALENDAR_SCOPE, getGrantedScopes } from '@/lib/google/tokens';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  const locale = locales.find((l) => l === rawLocale) ?? defaultLocale;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Prevent open redirect: next must be a relative path, not protocol-relative
  const safePath =
    next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: exchangeData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Code exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Use Google metadata when available (full_name, avatar_url)
        const meta = user.user_metadata ?? {};
        const displayName =
          meta.full_name || meta.name || (user.email?.split('@')[0] ?? 'User');
        const avatarUrl = meta.avatar_url || meta.picture || null;

        const profileData = {
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          preferred_locale: locale,
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.error('[auth/callback] Profile insert failed, retrying with upsert:', insertError.message);
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData);
          if (upsertError) {
            console.error('[auth/callback] Profile upsert retry failed:', upsertError.message);
          }
        }
      }

      // Capture Google provider tokens if this was a Google sign-in.
      // provider_refresh_token is ONLY available in this initial callback —
      // later getSession() calls will return null for it.
      await persistGoogleProviderTokens(supabase, user.id, exchangeData.session);
    }

    return NextResponse.redirect(`${origin}/${locale}${safePath}`);
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}

/**
 * If the session contains Google provider tokens (sign-in with Google),
 * persist them in google_accounts so the app can call Calendar API later.
 * No-op for magic-link sign-ins (no provider tokens).
 *
 * Never throws — token persistence failure must not block the login flow.
 */
async function persistGoogleProviderTokens(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  session: { provider_token?: string | null; provider_refresh_token?: string | null } | null,
): Promise<void> {
  try {
    const providerToken = session?.provider_token;
    const providerRefreshToken = session?.provider_refresh_token;
    if (!providerToken || !providerRefreshToken) return;

    // Inspect granted scopes — Google allows granular consent (user can
    // uncheck Calendar on the consent screen and still finish the flow).
    const scopes = await getGrantedScopes(providerToken);
    const calendarGranted = scopes?.includes(GOOGLE_CALENDAR_SCOPE) ?? false;

    // Fetch google_email — we need it as part of the (user_id, google_email) upsert key.
    const userinfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${providerToken}` } },
    );
    if (!userinfoRes.ok) {
      console.error('[auth/callback] userinfo fetch failed:', userinfoRes.status);
      return;
    }
    const userinfo = (await userinfoRes.json()) as { email?: string };
    if (!userinfo.email) return;

    // Google access tokens typically last 3600s — we conservatively set 1h expiry.
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('google_accounts')
      .upsert(
        {
          user_id: userId,
          google_email: userinfo.email,
          refresh_token: providerRefreshToken,
          access_token: providerToken,
          token_expires_at: expiresAt,
          calendar_granted: calendarGranted,
        },
        { onConflict: 'user_id,google_email' },
      );

    if (upsertError) {
      console.error(
        '[auth/callback] google_accounts upsert failed:',
        upsertError.message,
      );
    }
  } catch (err) {
    console.error('[auth/callback] Unexpected error persisting Google tokens:', err);
  }
}
