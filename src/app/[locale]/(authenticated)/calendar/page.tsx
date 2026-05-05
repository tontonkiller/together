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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const [eventsResult, eventTypesResult, googleSyncedResult, groupsResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, location, start_date, end_date, start_time, end_time, is_all_day, is_private, user_id, event_type_id, event_types(name, icon)')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true }),
    supabase
      .from('event_types')
      .select('id, name, icon, is_system')
      .order('is_system', { ascending: false }),
    supabase
      .from('google_synced_events')
      .select('event_id')
      .eq('status', 'accepted')
      .not('event_id', 'is', null),
    supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', user.id),
  ]);

  if (eventsResult.error) {
    console.error('[calendar] Events fetch failed:', eventsResult.error.message);
  }
  if (eventTypesResult.error) {
    console.error('[calendar] Event types fetch failed:', eventTypesResult.error.message);
  }
  if (groupsResult.error) {
    console.error('[calendar] Groups fetch failed:', groupsResult.error.message);
  }

  const normalizedEvents = (eventsResult.data ?? []).map((e) => ({
    ...e,
    event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
  })) as CalendarEvent[];

  const eventTypes = eventTypesResult.data;

  const googleEventIds = new Set(
    (googleSyncedResult.data ?? []).map((e) => e.event_id as string),
  );

  const userGroups: UserGroup[] = (groupsResult.data ?? [])
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
