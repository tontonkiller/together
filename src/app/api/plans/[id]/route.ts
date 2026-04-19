import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isExpired } from '@/lib/plans/resolveHelpers';

const PLAN_SELECT =
  'id, group_id, created_by, title, description, quorum, status, resolved_slot_id, event_id, expires_at, created_at, updated_at, slots:plan_slots(id, plan_id, start_date, end_date, start_time, end_time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: planId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: plan, error } = await supabase
    .from('plans')
    .select(PLAN_SELECT)
    .eq('id', planId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load plan' }, { status: 500 });
  }
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // Lazy expiration
  if (plan.status === 'open' && isExpired(plan.expires_at)) {
    await supabase.rpc('expire_plan', { p_plan_id: planId });
    const { data: refreshed } = await supabase
      .from('plans')
      .select(PLAN_SELECT)
      .eq('id', planId)
      .maybeSingle();
    return NextResponse.json({ plan: refreshed ?? plan });
  }

  return NextResponse.json({ plan });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: planId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { error, count } = await supabase
    .from('plans')
    .delete({ count: 'exact' })
    .eq('id', planId);

  if (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 400 });
  }
  if (count === 0) {
    // RLS blocked the delete (not creator or status != open)
    return NextResponse.json({ error: 'Not permitted' }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
