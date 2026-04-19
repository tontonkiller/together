import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import GroupDetailContent from './GroupDetailContent';
import type { GroupMember, PendingInvitation, GroupEvent, EventType } from './GroupDetailContent';
import type { PlanWithSlots } from '@/lib/types/plans';
import { isExpired } from '@/lib/plans/resolveHelpers';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  // Fetch group with invite_code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name, description, invite_code, avatar_url')
    .eq('id', id)
    .single();

  if (groupError) {
    console.error('[groups/detail] Group fetch failed:', id, groupError.message);
  }

  if (!group) {
    return redirect({ href: '/dashboard', locale });
  }

  // Fetch members with profiles
  const { data: members } = await supabase
    .from('group_members')
    .select('id, user_id, role, color, joined_at, profiles(display_name, avatar_url)')
    .eq('group_id', id)
    .order('joined_at', { ascending: true });

  // Find current user's role
  const currentMember = (members ?? []).find((m) => m.user_id === user.id);
  if (!currentMember) {
    // Not a member of this group
    return redirect({ href: '/dashboard', locale });
  }

  // Fetch pending invitations (for admins)
  let invitations: PendingInvitation[] = [];
  if (currentMember.role === 'admin') {
    const { data: invData } = await supabase
      .from('invitations')
      .select('id, invited_email, status, expires_at, created_at, invited_by_profile:profiles!invited_by(display_name)')
      .eq('group_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    invitations = (invData ?? []) as unknown as PendingInvitation[];
  }

  // Fetch events for this group (all members' events)
  const memberUserIds = (members ?? []).map((m) => m.user_id);
  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, location, start_date, end_date, start_time, end_time, is_all_day, is_private, user_id, event_type_id, event_types(name, icon)')
    .in('user_id', memberUserIds)
    .order('start_date', { ascending: true });

  // Fetch event types
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('id, name, icon, is_system')
    .order('is_system', { ascending: false });

  // Fetch plans for this group + trigger lazy expiration for stale plans
  const PLAN_SELECT =
    'id, group_id, created_by, title, description, quorum, status, resolved_slot_id, event_id, expires_at, created_at, updated_at, slots:plan_slots(id, plan_id, start_date, end_date, start_time, end_time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))';

  const { data: rawPlans, error: plansError } = await supabase
    .from('plans')
    .select(PLAN_SELECT)
    .eq('group_id', id)
    .order('created_at', { ascending: false });

  if (plansError) {
    console.error('[groups/detail] Plans fetch failed:', plansError.message);
  }

  const staleOpenPlanIds = (rawPlans ?? [])
    .filter((p) => p.status === 'open' && isExpired(p.expires_at as string))
    .map((p) => p.id as string);

  let plansData = rawPlans ?? [];
  if (staleOpenPlanIds.length > 0) {
    await Promise.all(
      staleOpenPlanIds.map((pid) => supabase.rpc('expire_plan', { p_plan_id: pid })),
    );
    const { data: refreshed } = await supabase
      .from('plans')
      .select(PLAN_SELECT)
      .eq('group_id', id)
      .order('created_at', { ascending: false });
    plansData = refreshed ?? plansData;
  }

  // Fetch creator profiles separately (avoids FK hint quirks)
  const planCreatorIds = Array.from(new Set(plansData.map((p) => p.created_by as string)));
  const planProfilesById: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (planCreatorIds.length > 0) {
    const { data: pp } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', planCreatorIds);
    for (const p of pp ?? []) {
      planProfilesById[p.id as string] = {
        display_name: p.display_name as string,
        avatar_url: (p.avatar_url as string | null) ?? null,
      };
    }
  }

  const normalizedPlans: PlanWithSlots[] = plansData.map((p) => ({
    ...(p as unknown as PlanWithSlots),
    creator_profile: planProfilesById[p.created_by as string] ?? null,
  }));

  // Fetch Google-imported event IDs for badge display
  const { data: googleSyncedEvents } = await supabase
    .from('google_synced_events')
    .select('event_id')
    .eq('status', 'accepted')
    .not('event_id', 'is', null);

  const googleEventIds = Array.from(
    new Set((googleSyncedEvents ?? []).map((e) => e.event_id as string)),
  );

  // Normalize Supabase's nested objects (profiles comes as array or object depending on query)
  const normalizedMembers: GroupMember[] = (members ?? []).map((m) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles,
  })) as GroupMember[];

  const normalizedEvents: GroupEvent[] = (events ?? []).map((e) => ({
    ...e,
    event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
  })) as GroupEvent[];

  return (
    <GroupDetailContent
      group={group}
      members={normalizedMembers}
      currentUserId={user.id}
      currentUserRole={currentMember.role}
      invitations={invitations}
      events={normalizedEvents}
      eventTypes={(eventTypes ?? []) as EventType[]}
      googleEventIds={googleEventIds}
      initialPlans={normalizedPlans}
    />
  );
}
