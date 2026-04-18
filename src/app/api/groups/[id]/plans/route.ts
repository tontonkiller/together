import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  extractPlanInput,
  validatePlanInput,
} from '@/lib/plans/validation';
import { isExpired } from '@/lib/plans/resolveHelpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // RLS will naturally filter out groups the user isn't in
  const { data: plans, error } = await supabase
    .from('plans')
    .select(
      'id, group_id, created_by, title, description, duration, quorum, status, resolved_slot_id, event_id, expires_at, created_at, updated_at, creator_profile:profiles!created_by(display_name, avatar_url), slots:plan_slots(id, plan_id, date, time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))',
    )
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/plans] List failed:', error.message);
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }

  // Lazy expiration: trigger expire_plan for any open plan past its deadline
  const expired = (plans ?? []).filter(
    (p) => p.status === 'open' && isExpired(p.expires_at),
  );
  if (expired.length > 0) {
    await Promise.all(
      expired.map((p) => supabase.rpc('expire_plan', { p_plan_id: p.id })),
    );
    // Re-fetch to get fresh statuses
    const { data: refreshed } = await supabase
      .from('plans')
      .select(
        'id, group_id, created_by, title, description, duration, quorum, status, resolved_slot_id, event_id, expires_at, created_at, updated_at, creator_profile:profiles!created_by(display_name, avatar_url), slots:plan_slots(id, plan_id, date, time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))',
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    return NextResponse.json({ plans: refreshed ?? [] });
  }

  return NextResponse.json({ plans: plans ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify membership + count members for quorum validation
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (membersError) {
    return NextResponse.json({ error: 'Failed to load group' }, { status: 500 });
  }

  const isMember = (members ?? []).some((m) => m.user_id === user.id);
  if (!isMember) {
    return NextResponse.json({ error: 'Not a group member' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const check = validatePlanInput(body, (members ?? []).length);
  if (!check.valid) {
    return NextResponse.json({ error: check.errorKey }, { status: 400 });
  }
  const input = extractPlanInput(body);
  if (!input) {
    return NextResponse.json({ error: 'invalidBody' }, { status: 400 });
  }

  const { data: planId, error } = await supabase.rpc('create_plan_with_slots', {
    p_group_id: groupId,
    p_title: input.title,
    p_description: input.description ?? '',
    p_duration: input.duration,
    p_quorum: input.quorum,
    p_slots: input.slots.map((s, i) => ({
      date: s.date,
      time: s.time ?? null,
      position: typeof s.position === 'number' ? s.position : i,
    })),
  });

  if (error) {
    console.error('[api/plans] Create failed:', error.message);
    return NextResponse.json({ error: 'createFailed', detail: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: planId }, { status: 201 });
}
