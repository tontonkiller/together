import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { accountId } = await request.json();

  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
  }

  // Verify the account belongs to the caller before doing anything destructive.
  // The RPC below is SECURITY DEFINER (bypasses RLS), so we must not call it
  // with an arbitrary account id.
  const { data: ownedAccount } = await supabase
    .from('google_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single();

  if (!ownedAccount) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  // Delete linked Together events via SECURITY DEFINER function (which also
  // re-checks ownership against auth.uid() as defense-in-depth).
  const { error: deleteEventsError } = await supabase
    .rpc('delete_events_for_google_account', { p_google_account_id: accountId });

  if (deleteEventsError) {
    console.error('[google/disconnect] Failed to delete linked events:', deleteEventsError.message);
    return NextResponse.json({ error: 'Failed to clean up events' }, { status: 500 });
  }

  // Then delete the google account (cascades to calendars + synced_events)
  const { error: deleteError } = await supabase
    .from('google_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('[google/disconnect] Failed to delete account:', deleteError.message);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
