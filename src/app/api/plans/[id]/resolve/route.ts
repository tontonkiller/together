import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateResolveInput } from '@/lib/plans/validation';

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
  const check = validateResolveInput(body);
  if (!check.valid) {
    return NextResponse.json({ error: check.errorKey }, { status: 400 });
  }
  const slotId = (body as { slot_id: string }).slot_id;

  const { data: eventId, error } = await supabase.rpc('resolve_plan_with_slot', {
    p_plan_id: planId,
    p_slot_id: slotId,
  });

  if (error) {
    console.error('[api/plans/resolve] Failed:', error.message);
    return NextResponse.json(
      { error: 'resolveFailed', detail: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, eventId });
}
