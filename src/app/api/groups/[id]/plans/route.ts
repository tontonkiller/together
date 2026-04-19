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

  // Fetch plans (no embedded profile to avoid FK hint resolution issues)
  const SELECT =
    'id, group_id, created_by, title, description, quorum, status, resolved_slot_id, event_id, expires_at, created_at, updated_at, slots:plan_slots(id, plan_id, start_date, end_date, start_time, end_time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))';

  const { data: plans, error } = await supabase
    .from('plans')
    .select(SELECT)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/plans] List failed:', JSON.stringify(error));
    return NextResponse.json(
      {
        error: 'Failed to load plans',
        detail: error.message,
        code: error.code,
        hint: error.hint,
      },
      { status: 500 },
    );
  }

  // Fetch creator profiles separately
  const creatorIds = Array.from(new Set((plans ?? []).map((p) => p.created_by)));
  const profilesById: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (creatorIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', creatorIds);
    for (const p of profs ?? []) {
      profilesById[p.id as string] = {
        display_name: p.display_name as string,
        avatar_url: (p.avatar_url as string | null) ?? null,
      };
    }
  }

  const enriched = (plans ?? []).map((p) => ({
    ...p,
    creator_profile: profilesById[p.created_by as string] ?? null,
  }));

  const expired = enriched.filter(
    (p) => p.status === 'open' && isExpired(p.expires_at as string),
  );
  if (expired.length > 0) {
    await Promise.all(
      expired.map((p) => supabase.rpc('expire_plan', { p_plan_id: p.id })),
    );
    const { data: refreshed } = await supabase
      .from('plans')
      .select(SELECT)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    const refreshedEnriched = (refreshed ?? []).map((p) => ({
      ...p,
      creator_profile: profilesById[p.created_by as string] ?? null,
    }));
    return NextResponse.json({ plans: refreshedEnriched });
  }

  return NextResponse.json({ plans: enriched });
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
    p_quorum: input.quorum,
    p_slots: input.slots.map((s, i) => ({
      start_date: s.start_date,
      end_date: s.end_date,
      start_time: s.start_time ?? null,
      end_time: s.end_time ?? null,
      position: typeof s.position === 'number' ? s.position : i,
    })),
  });

  if (error) {
    console.error('[api/plans] Create failed:', error.message);
    return NextResponse.json({ error: 'createFailed', detail: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: planId }, { status: 201 });
}
