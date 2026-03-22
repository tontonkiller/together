import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from '@/lib/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // First, handle Supabase session refresh
  const supabaseResponse = await updateSession(request);

  // Then, handle i18n routing
  const intlResponse = intlMiddleware(request);

  // Merge cookies from Supabase into the intl response
  if (intlResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });
    return intlResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*'],
};
