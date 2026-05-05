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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const today = new Date().toISOString().split('T')[0];

  const [profileResult, groupsResult, eventsResult, eventTypesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('group_members')
      .select('group_id, role, groups(id, name, description, avatar_url)')
      .eq('user_id', user.id),
    supabase
      .from('events')
      .select('id, title, description, location, start_date, end_date, is_all_day, is_private, start_time, end_time, user_id, event_type_id, event_types(name, icon)')
      .eq('user_id', user.id)
      .gte('end_date', today)
      .order('start_date', { ascending: true })
      .limit(5),
    supabase
      .from('event_types')
      .select('id, name, icon, is_system')
      .order('is_system', { ascending: false }),
  ]);

  const profile = profileResult.data;
  if (profileResult.error) {
    console.error('[dashboard] Profile fetch failed:', profileResult.error.message);
  }
  if (groupsResult.error) {
    console.error('[dashboard] Groups fetch failed:', groupsResult.error.message);
  }
  if (eventsResult.error) {
    console.error('[dashboard] Events fetch failed:', eventsResult.error.message);
  }

  // Supabase JS types joins as arrays, but many-to-one returns an object at runtime.
  // Map to normalize the shape.
  const normalizedGroups = (groupsResult.data ?? []).map((gm) => ({
    group_id: gm.group_id,
    role: gm.role,
    groups: Array.isArray(gm.groups) ? gm.groups[0] ?? null : gm.groups,
  }));

  const normalizedEvents = (eventsResult.data ?? []).map((e) => ({
    ...e,
    event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
  }));

  const eventTypes = eventTypesResult.data;

  // Fetch open plans across all user's groups to compute badge counts
  const groupIds = normalizedGroups.map((g) => g.group_id);
  let planBadges: Record<string, number> = {};
  if (groupIds.length > 0) {
    // Slim shape: computePlanBadges only reads status, group_id, created_by,
    // and slot.votes[].user_id (via hasUserVotedOnAnySlot). Selecting the full
    // plan tree (titles, dates, descriptions, vote rows with timestamps, etc.)
    // for every group on every dashboard load was wasting tens of KB of RSC
    // payload per render.
    const { data: openPlans } = await supabase
      .from('plans')
      .select(
        'group_id, created_by, status, slots:plan_slots!plan_slots_plan_id_fkey(votes:plan_votes(user_id))',
      )
      .in('group_id', groupIds)
      .in('status', ['open', 'pending_tiebreak']);

    planBadges = computePlanBadges(
      (openPlans ?? []) as unknown as PlanWithSlots[],
      user.id,
    ).pendingByGroup;
  }

  return (
    <DashboardContent
      profile={profile}
      groups={normalizedGroups}
      upcomingEvents={normalizedEvents as DashboardContentProps['upcomingEvents']}
      eventTypes={(eventTypes ?? []) as DashboardContentProps['eventTypes']}
      planBadges={planBadges}
    />
  );
}
