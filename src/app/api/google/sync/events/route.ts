import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/google/sync/events
 * Returns all synced events for the authenticated user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Fetch all synced events via joined query
  const { data: events, error } = await supabase
    .from('google_synced_events')
    .select(`
      id, google_event_id, event_id, status, visibility,
      title, description, location,
      start_date, end_date, start_time, end_time,
      is_all_day, is_recurring, google_updated_at, last_synced_at,
      google_calendars!inner(
        id, name, color,
        google_accounts!inner(user_id)
      )
    `)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[google/sync/events] Fetch failed:', error.message);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }

  // RLS ensures we only get our own events, but filter just in case
  const userEvents = (events ?? []).filter(
    (e) => {
      const gc = e.google_calendars as unknown as { google_accounts: { user_id: string } };
      return gc?.google_accounts?.user_id === user.id;
    },
  );

  return NextResponse.json({ events: userEvents });
}

/**
 * POST /api/google/sync/events
 * Accept or refuse synced events.
 * Body: { action: 'accept'|'refuse', ids: string[], visibility?: 'details'|'busy' }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { action, ids, visibility } = await request.json();

  if (!action || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (action === 'refuse') {
    // Mark as refused
    const { error } = await supabase
      .from('google_synced_events')
      .update({ status: 'refused' })
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: 'Failed to refuse events' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'accept') {
    const vis = visibility === 'busy' ? 'busy' : 'details';

    // Fetch the synced events to create Together events
    const { data: syncedEvents } = await supabase
      .from('google_synced_events')
      .select('*')
      .in('id', ids)
      .eq('status', 'pending');

    if (!syncedEvents || syncedEvents.length === 0) {
      return NextResponse.json({ success: true, created: 0 });
    }

    let created = 0;

    for (const se of syncedEvents) {
      // Create the Together event
      const eventData: Record<string, unknown> = {
        user_id: user.id,
        title: vis === 'busy' ? 'Occupé' : (se.title ?? 'Google Event'),
        description: vis === 'busy' ? null : se.description,
        location: vis === 'busy' ? null : se.location,
        start_date: se.start_date,
        end_date: se.end_date,
        start_time: se.start_time,
        end_time: se.end_time,
        is_all_day: se.is_all_day,
        is_private: vis === 'busy',
      };

      const { data: newEvent, error: insertError } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (insertError || !newEvent) {
        console.error('[sync/events] Failed to create event:', insertError?.message);
        continue;
      }

      // Link the synced event to the Together event
      await supabase
        .from('google_synced_events')
        .update({
          status: 'accepted',
          visibility: vis,
          event_id: newEvent.id,
        })
        .eq('id', se.id);

      created++;
    }

    return NextResponse.json({ success: true, created });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
