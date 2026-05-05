-- Performance indexes for hot read paths.
-- Each index covers a column that is filtered, joined, or ordered on at least
-- one of the page-level queries (dashboard, calendar, groups/[id]) or RLS
-- policies. `if not exists` keeps the migration idempotent.

-- events: every page filters by user_id; calendar/dashboard order by start_date
-- and filter end_date >= today.
create index if not exists idx_events_user_id on events(user_id);
create index if not exists idx_events_user_start on events(user_id, start_date);
create index if not exists idx_events_end_date on events(end_date);

-- group_members: only user_id had an index. group_id is hit on every group
-- detail/calendar query and inside RLS policies for events/plans.
create index if not exists idx_group_members_group_id on group_members(group_id);

-- plans: lazy-expire pattern filters open plans by expires_at.
create index if not exists idx_plans_expires_at on plans(expires_at) where status = 'open';

-- google_synced_events: status is filtered on every page that shows the
-- "synced from Google" badge (dashboard, calendar, groups/[id]).
create index if not exists idx_google_synced_events_status on google_synced_events(status);

-- invitations: group detail page filters by (group_id, status='pending');
-- invite redemption filters by (code, status, expires_at).
create index if not exists idx_invitations_group_status on invitations(group_id, status);
create index if not exists idx_invitations_expires_at on invitations(expires_at) where status = 'pending';
