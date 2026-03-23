-- Migration: Google Calendar Sync tables
-- Adds google_accounts, google_calendars, google_synced_events

-- ============================================
-- GOOGLE ACCOUNTS (connected Google accounts)
-- ============================================
create table if not exists google_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  google_email text not null,
  refresh_token text not null,
  access_token text,
  token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, google_email)
);

alter table google_accounts enable row level security;

create policy "Users can view own google accounts"
  on google_accounts for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own google accounts"
  on google_accounts for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own google accounts"
  on google_accounts for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own google accounts"
  on google_accounts for delete to authenticated
  using (user_id = auth.uid());

create trigger google_accounts_updated_at before update on google_accounts
  for each row execute function update_updated_at();

-- ============================================
-- GOOGLE CALENDARS (selected calendars per account)
-- ============================================
create table if not exists google_calendars (
  id uuid primary key default gen_random_uuid(),
  google_account_id uuid references google_accounts(id) on delete cascade not null,
  google_calendar_id text not null,
  name text not null,
  color text,
  is_enabled boolean default true,
  created_at timestamptz default now(),
  unique(google_account_id, google_calendar_id)
);

alter table google_calendars enable row level security;

-- Use SECURITY DEFINER to avoid cross-table recursion
create or replace function is_own_google_account(p_google_account_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from google_accounts where id = p_google_account_id and user_id = auth.uid()
  );
$$;

create policy "Users can view own google calendars"
  on google_calendars for select to authenticated
  using (is_own_google_account(google_account_id));

create policy "Users can insert own google calendars"
  on google_calendars for insert to authenticated
  with check (is_own_google_account(google_account_id));

create policy "Users can update own google calendars"
  on google_calendars for update to authenticated
  using (is_own_google_account(google_account_id));

create policy "Users can delete own google calendars"
  on google_calendars for delete to authenticated
  using (is_own_google_account(google_account_id));

-- ============================================
-- GOOGLE SYNCED EVENTS (imported event tracking)
-- ============================================
create table if not exists google_synced_events (
  id uuid primary key default gen_random_uuid(),
  google_calendar_id uuid references google_calendars(id) on delete cascade not null,
  google_event_id text not null,
  event_id uuid references events(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'refused')),
  visibility text not null default 'details' check (visibility in ('details', 'busy')),
  title text,
  description text,
  location text,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  is_all_day boolean default true,
  is_recurring boolean default false,
  recurring_event_id text,
  google_updated_at timestamptz,
  last_synced_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(google_calendar_id, google_event_id)
);

alter table google_synced_events enable row level security;

-- Use SECURITY DEFINER to check ownership through google_calendars → google_accounts
create or replace function is_own_google_calendar(p_google_calendar_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from google_calendars gc
    join google_accounts ga on gc.google_account_id = ga.id
    where gc.id = p_google_calendar_id and ga.user_id = auth.uid()
  );
$$;

create policy "Users can view own google synced events"
  on google_synced_events for select to authenticated
  using (is_own_google_calendar(google_calendar_id));

create policy "Users can insert own google synced events"
  on google_synced_events for insert to authenticated
  with check (is_own_google_calendar(google_calendar_id));

create policy "Users can update own google synced events"
  on google_synced_events for update to authenticated
  using (is_own_google_calendar(google_calendar_id));

create policy "Users can delete own google synced events"
  on google_synced_events for delete to authenticated
  using (is_own_google_calendar(google_calendar_id));

create trigger google_synced_events_updated_at before update on google_synced_events
  for each row execute function update_updated_at();

-- Index for fast lookup during sync
create index if not exists idx_google_synced_events_calendar_event
  on google_synced_events(google_calendar_id, google_event_id);

-- Index for finding events linked to Together events
create index if not exists idx_google_synced_events_event_id
  on google_synced_events(event_id) where event_id is not null;

-- ============================================
-- HELPER: Delete Together events when Google account disconnected
-- ============================================
create or replace function delete_events_for_google_account(p_google_account_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Delete all Together events that were imported from this Google account
  delete from events where id in (
    select gse.event_id from google_synced_events gse
    join google_calendars gc on gse.google_calendar_id = gc.id
    where gc.google_account_id = p_google_account_id
    and gse.event_id is not null
  );
  -- The google_calendars and google_synced_events rows will be cascade-deleted
  -- when the google_account row is deleted
end;
$$;
