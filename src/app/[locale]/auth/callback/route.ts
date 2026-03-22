import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale, locales } from '@/lib/i18n/config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? rawLocale
    : defaultLocale;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Prevent open redirect: next must be a relative path, not protocol-relative
  const safePath =
    next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              display_name: user.email?.split('@')[0] ?? 'User',
              preferred_locale: locale,
            });

          if (insertError) {
            // Retry once — race condition with concurrent logins
            await supabase.from('profiles').upsert({
              id: user.id,
              display_name: user.email?.split('@')[0] ?? 'User',
              preferred_locale: locale,
            });
          }
        }
      }

      return NextResponse.redirect(`${origin}/${locale}${safePath}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
