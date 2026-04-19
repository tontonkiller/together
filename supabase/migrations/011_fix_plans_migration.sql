-- Migration 011: Fix 010 (flex slot ranges + named dollar tags)
-- Safe to run whether 010 partially applied or not.
-- Migrates existing old-schema plan_slots (date, time) to new-schema
-- (start_date, end_date, start_time, end_time).

-- ============================================
-- 1. Ensure tables exist with final schema (no-op if already exist)
-- ============================================
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  created_by uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  quorum integer not null check (quorum > 0),
  status text not null default 'open' check (status in ('open', 'pending_tiebreak', 'resolved', 'expired')),
  resolved_slot_id uuid,
  event_id uuid references events(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '3 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists plan_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  position integer not null,
  created_at timestamptz default now(),
  constraint plan_slots_date_order check (end_date >= start_date)
);

-- ============================================
-- 2. Migrate existing old-schema columns (idempotent)
-- ============================================
do $migrate$
begin
  -- plan_slots : rename date → start_date
  if exists (
    select 1 from information_schema.columns
    where table_name = 'plan_slots' and column_name = 'date' and table_schema = 'public'
  ) then
    alter table plan_slots rename column date to start_date;
  end if;

  -- plan_slots : rename time → start_time
  if exists (
    select 1 from information_schema.columns
    where table_name = 'plan_slots' and column_name = 'time' and table_schema = 'public'
  ) then
    alter table plan_slots rename column time to start_time;
  end if;

  -- plan_slots : add end_date (default = start_date for existing rows)
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'plan_slots' and column_name = 'end_date' and table_schema = 'public'
  ) then
    alter table plan_slots add column end_date date;
    update plan_slots set end_date = start_date where end_date is null;
    alter table plan_slots alter column end_date set not null;
  end if;

  -- plan_slots : add end_time nullable
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'plan_slots' and column_name = 'end_time' and table_schema = 'public'
  ) then
    alter table plan_slots add column end_time time;
  end if;

  -- plan_slots : add end_date >= start_date check if missing
  if not exists (
    select 1 from pg_constraint where conname = 'plan_slots_date_order'
  ) then
    alter table plan_slots add constraint plan_slots_date_order check (end_date >= start_date);
  end if;

  -- plans : drop duration column + its check constraint if still present
  if exists (
    select 1 from information_schema.columns
    where table_name = 'plans' and column_name = 'duration' and table_schema = 'public'
  ) then
    alter table plans drop column duration;
  end if;
end $migrate$;

-- Add FK for resolved_slot_id if missing
do $fkcheck$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'plans_resolved_slot_fk'
  ) then
    alter table plans
      add constraint plans_resolved_slot_fk
      foreign key (resolved_slot_id) references plan_slots(id) on delete set null;
  end if;
end $fkcheck$;

create table if not exists plan_votes (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references plan_slots(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  available boolean not null,
  created_at timestamptz default now(),
  unique(slot_id, user_id)
);

create table if not exists event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Indexes
create index if not exists idx_plans_group_status on plans(group_id, status);
create index if not exists idx_plans_created_by on plans(created_by);
create index if not exists idx_plan_slots_plan_position on plan_slots(plan_id, position);
create index if not exists idx_plan_votes_slot on plan_votes(slot_id);
create index if not exists idx_plan_votes_user on plan_votes(user_id);
create index if not exists idx_event_participants_event on event_participants(event_id);
create index if not exists idx_event_participants_user on event_participants(user_id);

-- Enable RLS
alter table plans enable row level security;
alter table plan_slots enable row level security;
alter table plan_votes enable row level security;
alter table event_participants enable row level security;

-- Trigger (idempotent via drop-then-create)
drop trigger if exists plans_updated_at on plans;
create trigger plans_updated_at before update on plans
  for each row execute function update_updated_at();

-- ============================================
-- Drop old policies on the 4 new tables (idempotent)
-- Tables must exist first — that's why drop policy is here, not at top
-- ============================================
drop policy if exists "Group members can view plans in their groups" on plans;
drop policy if exists "Group members can create plans" on plans;
drop policy if exists "Plan creators can update their plans" on plans;
drop policy if exists "Plan creators can delete their open plans" on plans;
drop policy if exists "Group members can view plan slots" on plan_slots;
drop policy if exists "Plan creators can insert slots" on plan_slots;
drop policy if exists "Plan creators can delete slots of open plans" on plan_slots;
drop policy if exists "Group members can view all votes in their plans" on plan_votes;
drop policy if exists "Members can insert their own votes" on plan_votes;
drop policy if exists "Members can update their own votes" on plan_votes;
drop policy if exists "Members can delete their own votes" on plan_votes;
drop policy if exists "Users can view event participants they can see" on event_participants;
drop policy if exists "Event owners can insert participants" on event_participants;
drop policy if exists "Event owners can delete participants" on event_participants;

-- ============================================
-- Helper functions (named dollar tags)
-- ============================================
create or replace function is_own_plan(p_plan_id uuid)
returns boolean language sql security definer set search_path = public as $sql$
  select exists (
    select 1 from plans p
    join group_members gm on gm.group_id = p.group_id
    where p.id = p_plan_id and gm.user_id = auth.uid()
  );
$sql$;

create or replace function is_own_slot(p_slot_id uuid)
returns boolean language sql security definer set search_path = public as $sql$
  select exists (
    select 1 from plan_slots ps
    join plans p on p.id = ps.plan_id
    join group_members gm on gm.group_id = p.group_id
    where ps.id = p_slot_id and gm.user_id = auth.uid()
  );
$sql$;

create or replace function can_view_event(p_event_id uuid)
returns boolean language sql security definer set search_path = public as $sql$
  select exists (
    select 1 from events e
    where e.id = p_event_id
    and (
      e.user_id = auth.uid()
      or e.user_id in (
        select gm2.user_id from group_members gm1
        join group_members gm2 on gm1.group_id = gm2.group_id
        where gm1.user_id = auth.uid()
      )
    )
  );
$sql$;

create or replace function is_event_owner(p_event_id uuid)
returns boolean language sql security definer set search_path = public as $sql$
  select exists (select 1 from events where id = p_event_id and user_id = auth.uid());
$sql$;

-- (compute_event_times and duration_end_date_offset removed —
-- slots now carry their own start_date/end_date/start_time/end_time directly)

-- ============================================
-- RPC: create_plan_with_slots (named dollar tag, safe variable name)
-- ============================================
create or replace function create_plan_with_slots(
  p_group_id uuid,
  p_title text,
  p_description text,
  p_quorum integer,
  p_slots jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $plpgsql$
declare
  v_plan_id uuid;
  v_total_members int;
  v_slot jsonb;
  v_start date;
  v_end date;
begin
  if not is_group_member(p_group_id, auth.uid()) then
    raise exception 'Not a member of this group';
  end if;

  v_total_members := (select count(*)::int from group_members where group_id = p_group_id);

  if p_quorum > v_total_members then
    raise exception 'Quorum exceeds group member count';
  end if;

  if jsonb_array_length(p_slots) < 2 then
    raise exception 'At least 2 slots required';
  end if;

  v_plan_id := gen_random_uuid();
  insert into plans (id, group_id, created_by, title, description, quorum)
  values (v_plan_id, p_group_id, auth.uid(), p_title, nullif(p_description, ''), p_quorum);

  for v_slot in select * from jsonb_array_elements(p_slots) loop
    v_start := (v_slot->>'start_date')::date;
    v_end := coalesce(nullif(v_slot->>'end_date', '')::date, v_start);

    if v_end < v_start then
      raise exception 'Slot end_date must be >= start_date';
    end if;

    insert into plan_slots (plan_id, start_date, end_date, start_time, end_time, position)
    values (
      v_plan_id,
      v_start,
      v_end,
      nullif(v_slot->>'start_time', '')::time,
      nullif(v_slot->>'end_time', '')::time,
      (v_slot->>'position')::int
    );
  end loop;

  return v_plan_id;
end;
$plpgsql$;

create or replace function _create_event_from_slot(p_plan_id uuid, p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $plpgsql$
declare
  v_created_by uuid;
  v_title text;
  v_description text;
  v_start_date date;
  v_end_date date;
  v_start_time time;
  v_end_time time;
  v_is_all_day boolean;
  v_event_id uuid;
begin
  v_created_by := (select created_by from plans where id = p_plan_id);
  v_title := (select title from plans where id = p_plan_id);
  v_description := (select description from plans where id = p_plan_id);
  v_start_date := (select start_date from plan_slots where id = p_slot_id and plan_id = p_plan_id);
  v_end_date := (select end_date from plan_slots where id = p_slot_id and plan_id = p_plan_id);
  v_start_time := (select start_time from plan_slots where id = p_slot_id and plan_id = p_plan_id);
  v_end_time := (select end_time from plan_slots where id = p_slot_id and plan_id = p_plan_id);

  if v_start_date is null then
    raise exception 'Slot not found in plan';
  end if;

  v_is_all_day := v_start_time is null;

  v_event_id := gen_random_uuid();
  insert into events (id, user_id, title, description, start_date, end_date, start_time, end_time, is_all_day)
  values (
    v_event_id, v_created_by, v_title, v_description,
    v_start_date, v_end_date,
    v_start_time, v_end_time, v_is_all_day
  );

  insert into event_participants (event_id, user_id)
  select v_event_id, pv.user_id
  from plan_votes pv
  where pv.slot_id = p_slot_id and pv.available = true
  on conflict (event_id, user_id) do nothing;

  return v_event_id;
end;
$plpgsql$;

create or replace function resolve_plan_with_slot(p_plan_id uuid, p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $plpgsql$
declare
  v_created_by uuid;
  v_status text;
  v_quorum int;
  v_yes_count int;
  v_event_id uuid;
begin
  v_created_by := (select created_by from plans where id = p_plan_id);
  v_status := (select status from plans where id = p_plan_id);
  v_quorum := (select quorum from plans where id = p_plan_id);

  if v_created_by is null then
    raise exception 'Plan not found';
  end if;
  if v_status not in ('open', 'pending_tiebreak') then
    raise exception 'Plan already resolved or expired';
  end if;

  if v_created_by <> auth.uid() then
    v_yes_count := (select count(*)::int from plan_votes where slot_id = p_slot_id and available = true);

    if v_yes_count < v_quorum then
      raise exception 'Not permitted: not creator and quorum not reached';
    end if;
  end if;

  v_event_id := _create_event_from_slot(p_plan_id, p_slot_id);

  update plans
  set status = 'resolved', resolved_slot_id = p_slot_id, event_id = v_event_id
  where id = p_plan_id;

  return v_event_id;
end;
$plpgsql$;

create or replace function expire_plan(p_plan_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $plpgsql$
declare
  v_status text;
  v_expires_at timestamptz;
  v_max_votes int;
  v_winning_count int;
  v_winning_slot uuid;
  v_event_id uuid;
begin
  v_status := (select status from plans where id = p_plan_id);
  v_expires_at := (select expires_at from plans where id = p_plan_id);

  if v_status is null then return 'not_found'; end if;
  if v_status <> 'open' then return v_status; end if;
  if v_expires_at > now() then return v_status; end if;

  v_max_votes := (
    select coalesce(max(yes_count), 0)
    from (
      select count(*) filter (where pv.available = true) as yes_count
      from plan_slots ps
      left join plan_votes pv on pv.slot_id = ps.id
      where ps.plan_id = p_plan_id
      group by ps.id
    ) t
  );

  if v_max_votes = 0 then
    update plans set status = 'expired' where id = p_plan_id;
    return 'expired';
  end if;

  v_winning_count := (
    select count(*)
    from (
      select ps.id as slot_id
      from plan_slots ps
      left join plan_votes pv on pv.slot_id = ps.id
      where ps.plan_id = p_plan_id
      group by ps.id
      having count(*) filter (where pv.available = true) = v_max_votes
    ) t
  );

  v_winning_slot := (
    select min(slot_id)
    from (
      select ps.id as slot_id
      from plan_slots ps
      left join plan_votes pv on pv.slot_id = ps.id
      where ps.plan_id = p_plan_id
      group by ps.id
      having count(*) filter (where pv.available = true) = v_max_votes
    ) t
  );

  if v_winning_count = 1 then
    v_event_id := _create_event_from_slot(p_plan_id, v_winning_slot);
    update plans
    set status = 'resolved', resolved_slot_id = v_winning_slot, event_id = v_event_id
    where id = p_plan_id;
    return 'resolved';
  else
    update plans set status = 'pending_tiebreak' where id = p_plan_id;
    return 'pending_tiebreak';
  end if;
end;
$plpgsql$;

-- ============================================
-- RLS policies (recreate after drop at top)
-- ============================================
create policy "Group members can view plans in their groups"
  on plans for select to authenticated
  using (is_group_member(group_id, auth.uid()));

create policy "Group members can create plans"
  on plans for insert to authenticated
  with check (
    created_by = auth.uid()
    and is_group_member(group_id, auth.uid())
  );

create policy "Plan creators can update their plans"
  on plans for update to authenticated
  using (created_by = auth.uid());

create policy "Plan creators can delete their open plans"
  on plans for delete to authenticated
  using (created_by = auth.uid() and status = 'open');

create policy "Group members can view plan slots"
  on plan_slots for select to authenticated
  using (is_own_plan(plan_id));

create policy "Plan creators can insert slots"
  on plan_slots for insert to authenticated
  with check (
    exists (
      select 1 from plans
      where id = plan_id and created_by = auth.uid() and status = 'open'
    )
  );

create policy "Plan creators can delete slots of open plans"
  on plan_slots for delete to authenticated
  using (
    exists (
      select 1 from plans
      where id = plan_id and created_by = auth.uid() and status = 'open'
    )
  );

create policy "Group members can view all votes in their plans"
  on plan_votes for select to authenticated
  using (is_own_slot(slot_id));

create policy "Members can insert their own votes"
  on plan_votes for insert to authenticated
  with check (user_id = auth.uid() and is_own_slot(slot_id));

create policy "Members can update their own votes"
  on plan_votes for update to authenticated
  using (user_id = auth.uid());

create policy "Members can delete their own votes"
  on plan_votes for delete to authenticated
  using (user_id = auth.uid());

create policy "Users can view event participants they can see"
  on event_participants for select to authenticated
  using (can_view_event(event_id));

create policy "Event owners can insert participants"
  on event_participants for insert to authenticated
  with check (is_event_owner(event_id));

create policy "Event owners can delete participants"
  on event_participants for delete to authenticated
  using (is_event_owner(event_id));
