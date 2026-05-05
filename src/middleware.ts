import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Refreshes the Supabase auth cookie on every request so that server pages
// can use the cheap auth.getSession() (cookie read) instead of the expensive
// auth.getUser() (network call to Supabase Auth) for their auth gates.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip:
  //   - Next internals (_next/static, _next/image)
  //   - Static assets (favicon, sw.js, manifest, icons/, common file extensions)
  //   - API routes — they're an external trust boundary that already calls
  //     auth.getUser() in their own handlers; running middleware on them too
  //     would double the auth round-trip per request for no benefit.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|otf|map)$).*)',
  ],
};
