/**
 * Google Calendar API helpers.
 * Uses REST API directly — no googleapis dependency needed.
 */

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
}

export interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  status: string;
  recurringEventId?: string;
  updated: string;
}

interface CalendarListResponse {
  items: GoogleCalendar[];
}

interface EventListResponse {
  items: GoogleEvent[];
  nextPageToken?: string;
}

/**
 * Fetch the list of calendars for a Google account.
 */
export async function fetchGoogleCalendars(
  accessToken: string,
): Promise<GoogleCalendar[]> {
  const res = await fetch(`${CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch calendars: ${res.status}`);
  }

  const data: CalendarListResponse = await res.json();
  return data.items;
}

/**
 * Fetch events from a specific Google Calendar.
 * Returns all events in the given time range, expanding recurring events.
 */
export async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleEvent[]> {
  const allEvents: GoogleEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true', // Expand recurring events into individual instances
      orderBy: 'startTime',
      maxResults: '250',
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch events: ${res.status}`);
    }

    const data: EventListResponse = await res.json();
    // Only include confirmed/tentative events, skip cancelled
    allEvents.push(...data.items.filter((e) => e.status !== 'cancelled'));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allEvents;
}

/**
 * Parse a Google event's start/end into date and time fields.
 */
export function parseGoogleEventDates(event: GoogleEvent): {
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
} {
  if (event.start.date && event.end.date) {
    // All-day event: end date in Google is exclusive, so subtract 1 day
    const endDate = new Date(event.end.date);
    endDate.setDate(endDate.getDate() - 1);
    return {
      start_date: event.start.date,
      end_date: endDate.toISOString().split('T')[0],
      start_time: null,
      end_time: null,
      is_all_day: true,
    };
  }

  // Timed event
  const startDt = new Date(event.start.dateTime!);
  const endDt = new Date(event.end.dateTime!);

  return {
    start_date: startDt.toISOString().split('T')[0],
    end_date: endDt.toISOString().split('T')[0],
    start_time: startDt.toTimeString().slice(0, 5), // HH:MM
    end_time: endDt.toTimeString().slice(0, 5),
    is_all_day: false,
  };
}
