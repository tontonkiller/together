import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildGoogleAuthUrl } from '@/lib/google/tokens';

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

  // State encodes user ID and locale for the callback
  const state = JSON.stringify({ userId: user.id, locale });
  const authUrl = buildGoogleAuthUrl(redirectUri, state);

  return NextResponse.json({ url: authUrl });
}
