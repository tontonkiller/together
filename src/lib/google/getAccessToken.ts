/**
 * Get a valid access token for a Google account.
 * Refreshes the token if expired and updates the DB.
 */
import { type SupabaseClient } from '@supabase/supabase-js';
import { refreshAccessToken } from './tokens';

interface GoogleAccount {
  id: string;
  access_token: string | null;
  refresh_token: string;
  token_expires_at: string | null;
}

export async function getAccessToken(
  supabase: SupabaseClient,
  account: GoogleAccount,
): Promise<string> {
  // Check if current token is still valid (with 5 min buffer)
  if (account.access_token && account.token_expires_at) {
    const expiresAt = new Date(account.token_expires_at);
    const buffer = 5 * 60 * 1000; // 5 minutes
    if (expiresAt.getTime() - buffer > Date.now()) {
      return account.access_token;
    }
  }

  // Refresh the token (Google may rotate the refresh_token — persist if it does)
  const { access_token, expires_at, refresh_token } = await refreshAccessToken(
    account.refresh_token,
  );

  const update: {
    access_token: string;
    token_expires_at: string;
    refresh_token?: string;
  } = {
    access_token,
    token_expires_at: expires_at.toISOString(),
  };
  if (refresh_token) {
    update.refresh_token = refresh_token;
  }

  await supabase.from('google_accounts').update(update).eq('id', account.id);

  return access_token;
}
