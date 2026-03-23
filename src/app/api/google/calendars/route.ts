import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGoogleCalendars } from '@/lib/google/calendar';
import { getAccessToken } from '@/lib/google/getAccessToken';

/**
 * GET /api/google/calendars?accountId=X
 * Fetch Google calendars for an account, merge with saved selections.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
  }

  // Fetch the Google account (RLS ensures it belongs to user)
  const { data: account, error: accountError } = await supabase
    .from('google_accounts')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  try {
    const accessToken = await getAccessToken(supabase, account);
    const googleCalendars = await fetchGoogleCalendars(accessToken);

    // Fetch saved calendar selections
    const { data: savedCalendars } = await supabase
      .from('google_calendars')
      .select('google_calendar_id, is_enabled')
      .eq('google_account_id', accountId);

    const savedMap = new Map(
      (savedCalendars ?? []).map((c) => [c.google_calendar_id, c.is_enabled]),
    );

    // Merge: Google calendars with saved enabled/disabled state
    const calendars = googleCalendars.map((gc) => ({
      id: gc.id,
      name: gc.summary,
      color: gc.backgroundColor ?? null,
      primary: gc.primary ?? false,
      is_enabled: savedMap.get(gc.id) ?? false, // New calendars default to disabled
    }));

    return NextResponse.json({ calendars });
  } catch (err) {
    console.error('[google/calendars] Failed to fetch:', err);
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
  }
}

/**
 * POST /api/google/calendars
 * Save calendar selection (enable/disable calendars).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { accountId, calendars } = await request.json();

  if (!accountId || !Array.isArray(calendars)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Verify account belongs to user
  const { data: account } = await supabase
    .from('google_accounts')
    .select('id')
    .eq('id', accountId)
    .single();

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  // Upsert each calendar selection
  for (const cal of calendars as Array<{ id: string; name: string; color: string | null; is_enabled: boolean }>) {
    await supabase
      .from('google_calendars')
      .upsert(
        {
          google_account_id: accountId,
          google_calendar_id: cal.id,
          name: cal.name,
          color: cal.color,
          is_enabled: cal.is_enabled,
        },
        { onConflict: 'google_account_id,google_calendar_id' },
      );
  }

  return NextResponse.json({ success: true });
}
