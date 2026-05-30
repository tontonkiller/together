-- Migration: harden delete_events_for_google_account
--
-- The original function (006_google_calendar_sync.sql) is SECURITY DEFINER and
-- deleted Together events joined through the supplied google_account_id WITHOUT
-- verifying the caller owns that account. Because it bypasses RLS, an
-- authenticated user could pass another user's google_account_id and delete the
-- events imported from it. We now gate the whole operation on ownership via
-- auth.uid() so the SECURITY DEFINER privilege can't be abused.

create or replace function delete_events_for_google_account(p_google_account_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Refuse to touch anything unless the caller actually owns the account.
  if not exists (
    select 1 from google_accounts
    where id = p_google_account_id and user_id = auth.uid()
  ) then
    return;
  end if;

  -- Delete all Together events that were imported from this Google account.
  delete from events where id in (
    select gse.event_id from google_synced_events gse
    join google_calendars gc on gse.google_calendar_id = gc.id
    where gc.google_account_id = p_google_account_id
    and gse.event_id is not null
  );
  -- The google_calendars and google_synced_events rows will be cascade-deleted
  -- when the google_account row is deleted.
end;
$$;
