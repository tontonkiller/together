import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardContent, { type DashboardContentProps } from './DashboardContent';
import { computePlanBadges } from '@/lib/plans/queries';
import type { PlanWithSlots } from '@/lib/types/plans';

export default async function DashboardPage({
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError) {
    console.error('[dashboard] Profile fetch failed:', profileError.message);
  }

  const { data: groups, error: groupsError } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, description, avatar_url)')
    .eq('user_id', user.id);
  if (groupsError) {
    console.error('[dashboard] Groups fetch failed:', groupsError.message);
  }

  // Supabase JS types joins as arrays, but many-to-one returns an object at runtime.
  // Map to normalize the shape.
  const normalizedGroups = (groups ?? []).map((gm) => ({
    group_id: gm.group_id,
    role: gm.role,
    groups: Array.isArray(gm.groups) ? gm.groups[0] ?? null : gm.groups,
  }));

  // Fetch upcoming events (next 30 days) — include all fields for edit dialog
  const today = new Date().toISOString().split('T')[0];
  const { data: upcomingEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, title, description, location, start_date, end_date, is_all_day, is_private, start_time, end_time, user_id, event_type_id, event_types(name, icon)')
    .eq('user_id', user.id)
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(5);
  if (eventsError) {
    console.error('[dashboard] Events fetch failed:', eventsError.message);
  }

  const normalizedEvents = (upcomingEvents ?? []).map((e) => ({
    ...e,
    event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
  }));

  // Fetch event types for edit dialog
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('id, name, icon, is_system')
    .order('is_system', { ascending: false });

  // Fetch open plans across all user's groups to compute badge counts
  const groupIds = normalizedGroups.map((g) => g.group_id);
  let planBadges: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: openPlans } = await supabase
      .from('plans')
      .select(
        'id, group_id, created_by, title, description, quorum, status, resolved_slot_id, event_id, expires_at, created_at, updated_at, slots:plan_slots!plan_slots_plan_id_fkey(id, plan_id, start_date, end_date, start_time, end_time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))',
      )
      .in('group_id', groupIds)
      .in('status', ['open', 'pending_tiebreak']);

    const plansList = ((openPlans ?? []) as unknown as PlanWithSlots[]).map((p) => ({
      ...p,
      creator_profile: Array.isArray(p.creator_profile)
        ? (p.creator_profile as unknown as { display_name: string; avatar_url: string | null }[])[0] ?? null
        : p.creator_profile,
    }));

    planBadges = computePlanBadges(plansList, user.id).pendingByGroup;
  }

  // Check if the user has a Google account connected but calendar scope
  // was unchecked during consent — if so, show a banner to reconnect.
  const { data: googleAccounts } = await supabase
    .from('google_accounts')
    .select('id, calendar_granted')
    .eq('user_id', user.id);

  const hasGoogleAccount = (googleAccounts ?? []).length > 0;
  const calendarMissing =
    hasGoogleAccount &&
    (googleAccounts ?? []).every((a) => a.calendar_granted === false);

  return (
    <DashboardContent
      profile={profile}
      groups={normalizedGroups}
      upcomingEvents={normalizedEvents as DashboardContentProps['upcomingEvents']}
      eventTypes={(eventTypes ?? []) as DashboardContentProps['eventTypes']}
      planBadges={planBadges}
      calendarReconnectNeeded={calendarMissing}
    />
  );
}
