-- Migration 011: Fix 010 (bare $$ caused Supabase SQL Editor split issue)
-- Safe to run whether 010 partially applied or not.
-- Recreates functions with named dollar tags and idempotent policies.

-- ============================================
-- Drop old policies (idempotent)
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
-- Ensure tables exist (idempotent — matches 010)
-- ============================================
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  created_by uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  duration text not null check (duration in ('30min', '1h', '2h', '3h', 'half_day', 'full_day')),
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
  date date not null,
  time time,
  position integer not null,
  created_at timestamptz default now()
);

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

create or replace function compute_event_times(p_slot_time time, p_duration text)
returns table(start_time time, end_time time, is_all_day boolean)
language sql immutable as $sql$
  select
    case when p_slot_time is null or p_duration in ('half_day', 'full_day') then null::time
         else p_slot_time
    end as start_time,
    case
      when p_slot_time is null or p_duration in ('half_day', 'full_day') then null::time
      when p_duration = '30min' then (p_slot_time + interval '30 minutes')::time
      when p_duration = '1h'    then (p_slot_time + interval '1 hour')::time
      when p_duration = '2h'    then (p_slot_time + interval '2 hours')::time
      when p_duration = '3h'    then (p_slot_time + interval '3 hours')::time
      else null::time
    end as end_time,
    (p_slot_time is null or p_duration in ('half_day', 'full_day')) as is_all_day;
$sql$;

-- ============================================
-- RPC: create_plan_with_slots (named dollar tag, safe variable name)
-- ============================================
create or replace function create_plan_with_slots(
  p_group_id uuid,
  p_title text,
  p_description text,
  p_duration text,
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
begin
  if not is_group_member(p_group_id, auth.uid()) then
    raise exception 'Not a member of this group';
  end if;

  select count(*)::int into v_total_members
  from group_members where group_id = p_group_id;

  if p_quorum > v_total_members then
    raise exception 'Quorum exceeds group member count';
  end if;

  if jsonb_array_length(p_slots) < 2 then
    raise exception 'At least 2 slots required';
  end if;

  insert into plans (group_id, created_by, title, description, duration, quorum)
  values (p_group_id, auth.uid(), p_title, nullif(p_description, ''), p_duration, p_quorum)
  returning id into v_plan_id;

  for v_slot in select * from jsonb_array_elements(p_slots) loop
    insert into plan_slots (plan_id, date, time, position)
    values (
      v_plan_id,
      (v_slot->>'date')::date,
      nullif(v_slot->>'time', '')::time,
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
  v_plan plans%rowtype;
  v_slot plan_slots%rowtype;
  v_times record;
  v_event_id uuid;
begin
  select * into v_plan from plans where id = p_plan_id;
  select * into v_slot from plan_slots where id = p_slot_id and plan_id = p_plan_id;

  if v_slot.id is null then
    raise exception 'Slot not found in plan';
  end if;

  select * into v_times from compute_event_times(v_slot.time, v_plan.duration);

  insert into events (user_id, title, description, start_date, end_date, start_time, end_time, is_all_day)
  values (
    v_plan.created_by,
    v_plan.title,
    v_plan.description,
    v_slot.date,
    v_slot.date,
    v_times.start_time,
    v_times.end_time,
    v_times.is_all_day
  )
  returning id into v_event_id;

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
  v_plan plans%rowtype;
  v_yes_count int;
  v_event_id uuid;
begin
  select * into v_plan from plans where id = p_plan_id;
  if v_plan.id is null then
    raise exception 'Plan not found';
  end if;
  if v_plan.status not in ('open', 'pending_tiebreak') then
    raise exception 'Plan already resolved or expired';
  end if;

  if v_plan.created_by <> auth.uid() then
    select count(*)::int into v_yes_count
    from plan_votes where slot_id = p_slot_id and available = true;

    if v_yes_count < v_plan.quorum then
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
  v_plan plans%rowtype;
  v_max_votes int;
  v_winning_count int;
  v_winning_slot uuid;
  v_event_id uuid;
begin
  select * into v_plan from plans where id = p_plan_id;
  if v_plan.id is null then return 'not_found'; end if;
  if v_plan.status <> 'open' then return v_plan.status; end if;
  if v_plan.expires_at > now() then return v_plan.status; end if;

  select coalesce(max(yes_count), 0) into v_max_votes
  from (
    select count(*) filter (where pv.available = true) as yes_count
    from plan_slots ps
    left join plan_votes pv on pv.slot_id = ps.id
    where ps.plan_id = p_plan_id
    group by ps.id
  ) t;

  if v_max_votes = 0 then
    update plans set status = 'expired' where id = p_plan_id;
    return 'expired';
  end if;

  select count(*), min(slot_id) into v_winning_count, v_winning_slot
  from (
    select ps.id as slot_id, count(*) filter (where pv.available = true) as yes_count
    from plan_slots ps
    left join plan_votes pv on pv.slot_id = ps.id
    where ps.plan_id = p_plan_id
    group by ps.id
    having count(*) filter (where pv.available = true) = v_max_votes
  ) t;

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
