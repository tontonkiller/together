import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractVotes, validateVoteInput } from '@/lib/plans/validation';
import { countYesVotes, findQuorumSlot } from '@/lib/plans/resolveHelpers';
import type { PlanSlotWithVotes, PlanWithSlots } from '@/lib/types/plans';

export async function POST(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const check = validateVoteInput(body);
  if (!check.valid) {
    return NextResponse.json({ error: check.errorKey }, { status: 400 });
  }
  const votes = extractVotes(body);

  // Fetch plan + slots to validate slot ownership and check status
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select(
      'id, quorum, status, created_by, slots:plan_slots(id, plan_id, date, time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))',
    )
    .eq('id', planId)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }
  if (plan.status !== 'open') {
    return NextResponse.json({ error: 'Plan not open' }, { status: 400 });
  }

  const validSlotIds = new Set((plan.slots as PlanSlotWithVotes[]).map((s) => s.id));
  for (const v of votes) {
    if (!validSlotIds.has(v.slot_id)) {
      return NextResponse.json({ error: 'invalidSlotId' }, { status: 400 });
    }
  }

  if (votes.length > 0) {
    const rows = votes.map((v) => ({
      slot_id: v.slot_id,
      user_id: user.id,
      available: v.available,
    }));
    const { error: upsertError } = await supabase
      .from('plan_votes')
      .upsert(rows, { onConflict: 'slot_id,user_id' });

    if (upsertError) {
      console.error('[api/plans/vote] Upsert failed:', upsertError.message);
      return NextResponse.json({ error: 'voteFailed' }, { status: 400 });
    }
  }

  // Re-fetch plan with fresh votes to check quorum
  const { data: refreshed } = await supabase
    .from('plans')
    .select(
      'id, quorum, status, created_by, slots:plan_slots(id, plan_id, date, time, position, created_at, votes:plan_votes(id, slot_id, user_id, available, created_at))',
    )
    .eq('id', planId)
    .maybeSingle();

  let resolvedEventId: string | null = null;
  if (refreshed && refreshed.status === 'open') {
    const slotId = findQuorumSlot(refreshed as unknown as PlanWithSlots);
    if (slotId) {
      const { data: eventId, error: resolveError } = await supabase.rpc(
        'resolve_plan_with_slot',
        { p_plan_id: planId, p_slot_id: slotId },
      );
      if (!resolveError && eventId) {
        resolvedEventId = eventId as string;
      } else if (resolveError) {
        console.error('[api/plans/vote] Auto-resolve failed:', resolveError.message);
      }
    }
  }

  const yesCounts = (refreshed?.slots ?? []).map((s: PlanSlotWithVotes) => ({
    slot_id: s.id,
    yes_count: countYesVotes(s),
  }));

  return NextResponse.json({
    success: true,
    yesCounts,
    resolvedEventId,
  });
}
