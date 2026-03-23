import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale, locales } from '@/lib/i18n/config';

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

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
    }

    return NextResponse.redirect(`${origin}/${locale}${safePath}`);
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
