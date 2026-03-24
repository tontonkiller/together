/**
 * Google Calendar sync engine.
 * Fetches events from Google, compares with DB, creates/updates/deletes synced events.
 */
import { type SupabaseClient } from '@supabase/supabase-js';
import { fetchGoogleEvents, parseGoogleEventDates, type GoogleEvent } from './calendar';
import { getAccessToken } from './getAccessToken';

interface GoogleAccount {
  id: string;
  access_token: string | null;
  refresh_token: string;
  token_expires_at: string | null;
}

interface GoogleCalendarRow {
  id: string;
  google_calendar_id: string;
  google_account_id: string;
}

interface SyncedEventRow {
  id: string;
  google_event_id: string;
  google_calendar_id: string;
  event_id: string | null;
  status: string;
  google_updated_at: string | null;
}

/**
 * Sync all enabled Google calendars for a user.
 * Returns the count of new pending events found.
 */
export async function fetchAndSyncEvents(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ newPending: number; updated: number; deleted: number }> {
  let newPending = 0;
  let updated = 0;
  let deleted = 0;

  // Get all Google accounts for this user
  const { data: accounts } = await supabase
    .from('google_accounts')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('user_id', userId);

  if (!accounts || accounts.length === 0) return { newPending, updated, deleted };

  // Time range: now to +6 months
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 6);

  for (const account of accounts as GoogleAccount[]) {
    // Get enabled calendars for this account
    const { data: calendars } = await supabase
      .from('google_calendars')
      .select('id, google_calendar_id, google_account_id')
      .eq('google_account_id', account.id)
      .eq('is_enabled', true);

    if (!calendars || calendars.length === 0) continue;

    let accessToken: string;
    try {
      accessToken = await getAccessToken(supabase, account);
    } catch (err) {
      console.error(`[sync] Failed to get access token for account ${account.id}:`, err);
      continue;
    }

    for (const calendar of calendars as GoogleCalendarRow[]) {
      try {
        const result = await syncCalendar(
          supabase,
          accessToken,
          calendar,
          userId,
          timeMin,
          timeMax,
        );
        newPending += result.newPending;
        updated += result.updated;
        deleted += result.deleted;
      } catch (err) {
        console.error(`[sync] Failed to sync calendar ${calendar.google_calendar_id}:`, err);
      }
    }
  }

  return { newPending, updated, deleted };
}

async function syncCalendar(
  supabase: SupabaseClient,
  accessToken: string,
  calendar: GoogleCalendarRow,
  userId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<{ newPending: number; updated: number; deleted: number }> {
  let newPending = 0;
  let updated = 0;
  let deleted = 0;

  // Fetch events from Google
  const googleEvents = await fetchGoogleEvents(
    accessToken,
    calendar.google_calendar_id,
    timeMin,
    timeMax,
  );

  // Fetch existing synced events for this calendar
  const { data: existingEvents } = await supabase
    .from('google_synced_events')
    .select('id, google_event_id, google_calendar_id, event_id, status, google_updated_at')
    .eq('google_calendar_id', calendar.id);

  const existingMap = new Map(
    (existingEvents ?? []).map((e: SyncedEventRow) => [e.google_event_id, e]),
  );

  const googleEventIds = new Set<string>();

  for (const gEvent of googleEvents) {
    googleEventIds.add(gEvent.id);
    const existing = existingMap.get(gEvent.id);

    if (!existing) {
      // New event — insert as pending
      await insertSyncedEvent(supabase, calendar.id, gEvent);
      newPending++;
    } else {
      // Existing event — check if updated
      const googleUpdated = new Date(gEvent.updated).toISOString();
      if (existing.google_updated_at !== googleUpdated) {
        // Event was modified on Google
        const result = await updateSyncedEvent(supabase, existing, gEvent, userId);
        if (result) updated++;
      }
    }
  }

  // Find events in DB that no longer exist on Google → delete them
  for (const [googleEventId, existing] of existingMap) {
    if (!googleEventIds.has(googleEventId)) {
      // Event was deleted on Google
      if (existing.event_id) {
        // Delete the Together event
        await supabase.from('events').delete().eq('id', existing.event_id);
      }
      await supabase.from('google_synced_events').delete().eq('id', existing.id);
      deleted++;
    }
  }

  return { newPending, updated, deleted };
}

async function insertSyncedEvent(
  supabase: SupabaseClient,
  googleCalendarId: string,
  gEvent: GoogleEvent,
): Promise<void> {
  const dates = parseGoogleEventDates(gEvent);

  await supabase.from('google_synced_events').insert({
    google_calendar_id: googleCalendarId,
    google_event_id: gEvent.id,
    status: 'pending',
    visibility: 'details',
    title: gEvent.summary ?? '(No title)',
    description: gEvent.description ?? null,
    location: gEvent.location ?? null,
    start_date: dates.start_date,
    end_date: dates.end_date,
    start_time: dates.start_time,
    end_time: dates.end_time,
    is_all_day: dates.is_all_day,
    is_recurring: !!gEvent.recurringEventId,
    recurring_event_id: gEvent.recurringEventId ?? null,
    google_updated_at: new Date(gEvent.updated).toISOString(),
    last_synced_at: new Date().toISOString(),
  });
}

async function updateSyncedEvent(
  supabase: SupabaseClient,
  existing: SyncedEventRow,
  gEvent: GoogleEvent,
  userId: string,
): Promise<boolean> {
  const dates = parseGoogleEventDates(gEvent);

  // Update cached data in google_synced_events
  await supabase
    .from('google_synced_events')
    .update({
      title: gEvent.summary ?? '(No title)',
      description: gEvent.description ?? null,
      location: gEvent.location ?? null,
      start_date: dates.start_date,
      end_date: dates.end_date,
      start_time: dates.start_time,
      end_time: dates.end_time,
      is_all_day: dates.is_all_day,
      google_updated_at: new Date(gEvent.updated).toISOString(),
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  // If event was accepted, also update the linked Together event
  if (existing.status === 'accepted' && existing.event_id) {
    await supabase
      .from('events')
      .update({
        title: gEvent.summary ?? '(No title)',
        description: gEvent.description ?? null,
        location: gEvent.location ?? null,
        start_date: dates.start_date,
        end_date: dates.end_date,
        start_time: dates.start_time,
        end_time: dates.end_time,
        is_all_day: dates.is_all_day,
      })
      .eq('id', existing.event_id)
      .eq('user_id', userId);
  }

  return true;
}
