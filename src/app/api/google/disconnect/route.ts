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

  // First, delete linked Together events via SECURITY DEFINER function
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
