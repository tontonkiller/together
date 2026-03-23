import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use SECURITY DEFINER RPC to find group (non-members can't query groups via RLS)
  const { data: groupData, error: groupError } = await supabase
    .rpc('find_group_by_invite_code', { code_param: code });

  if (groupError || !groupData || groupData.length === 0) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
  }

  const groupId = groupData[0].id;

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    return NextResponse.json({ groupId, alreadyMember: true });
  }

  // Use SECURITY DEFINER RPC to atomically join group + mark invitations accepted
  // Color is auto-assigned from palette based on member count inside the function
  const { data: joinResult, error: joinError } = await supabase
    .rpc('join_group_by_invite_code', { code_param: code });

  if (joinError) {
    console.error('[api/invite] Join failed:', joinError.message);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 400 });
  }

  return NextResponse.json({ groupId: joinResult ?? groupId });
}
