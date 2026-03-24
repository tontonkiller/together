import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import CalendarContent from './CalendarContent';
import type { CalendarEvent, EventType } from '@/lib/types/events';

interface UserGroup {
  id: string;
  name: string;
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  // Fetch all user events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, description, location, start_date, end_date, start_time, end_time, is_all_day, is_private, user_id, event_type_id, event_types(name, icon)')
    .eq('user_id', user.id)
    .order('start_date', { ascending: true });

  if (eventsError) {
    console.error('[calendar] Events fetch failed:', eventsError.message);
  }

  const normalizedEvents = (events ?? []).map((e) => ({
    ...e,
    event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
  })) as CalendarEvent[];

  // Fetch event types
  const { data: eventTypes, error: typesError } = await supabase
    .from('event_types')
    .select('id, name, icon, is_system')
    .order('is_system', { ascending: false });

  if (typesError) {
    console.error('[calendar] Event types fetch failed:', typesError.message);
  }

  // Fetch Google-imported event IDs for badge display
  const { data: googleSyncedEvents } = await supabase
    .from('google_synced_events')
    .select('event_id')
    .eq('status', 'accepted')
    .not('event_id', 'is', null);

  const googleEventIds = new Set(
    (googleSyncedEvents ?? []).map((e) => e.event_id as string),
  );

  // Fetch user's groups for the group selector
  const { data: groupMemberships, error: groupsError } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('user_id', user.id);

  if (groupsError) {
    console.error('[calendar] Groups fetch failed:', groupsError.message);
  }

  const userGroups: UserGroup[] = (groupMemberships ?? [])
    .map((gm) => {
      const g = Array.isArray(gm.groups) ? gm.groups[0] : gm.groups;
      return g ? { id: g.id, name: g.name } : null;
    })
    .filter((g): g is UserGroup => g !== null);

  return (
    <CalendarContent
      events={normalizedEvents}
      eventTypes={(eventTypes ?? []) as EventType[]}
      userGroups={userGroups}
      currentUserId={user.id}
      googleEventIds={Array.from(googleEventIds)}
    />
  );
}
