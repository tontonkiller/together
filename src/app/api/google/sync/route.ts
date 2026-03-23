import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchAndSyncEvents } from '@/lib/google/sync';

/**
 * POST /api/google/sync
 * Trigger a sync for the authenticated user's Google calendars.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const result = await fetchAndSyncEvents(supabase, user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[google/sync] Sync failed:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
