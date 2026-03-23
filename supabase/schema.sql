-- Together - Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  preferred_locale text default 'fr' check (preferred_locale in ('fr', 'en')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "Users can insert own profile"
  on profiles for insert to authenticated
  with check (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update to authenticated using (id = auth.uid());

-- ============================================
-- GROUPS
-- ============================================
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references profiles(id) not null,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table groups enable row level security;

create policy "Group members can view their groups"
  on groups for select to authenticated
  using (
    id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "Authenticated users can create groups"
  on groups for insert to authenticated
  with check (created_by = auth.uid());

create policy "Group admins can update their groups"
  on groups for update to authenticated
  using (
    id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can delete their groups"
  on groups for delete to authenticated
  using (
    id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- GROUP MEMBERS
-- ============================================
create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  color text not null default '#1976D2',
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Index for RLS subqueries (user_id is frequently filtered alone)
create index if not exists idx_group_members_user_id on group_members(user_id);

alter table group_members enable row level security;

create policy "Group members can view other members in their groups"
  on group_members for select to authenticated
  using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

-- Users can only join groups they were invited to or that they just created
create policy "Users can join groups via invitation or as creator"
  on group_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      -- Creator adding themselves as admin to their own group
      group_id in (select id from groups where created_by = auth.uid())
      -- Or user has a pending invitation
      or group_id in (
        select group_id from invitations
        where invited_email = (select email from auth.users where id = auth.uid())
          and status = 'pending'
          and expires_at > now()
      )
    )
  );

create policy "Group admins can update members"
  on group_members for update to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    -- Prevent changing user_id (only role and color can be updated)
    user_id = user_id
    and group_id = group_id
  );

create policy "Group admins can remove members"
  on group_members for delete to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
    or user_id = auth.uid() -- members can remove themselves
  );

-- ============================================
-- EVENT TYPES
-- ============================================
create table if not exists event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  is_system boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table event_types enable row level security;

create policy "Anyone authenticated can view event types"
  on event_types for select to authenticated using (true);

create policy "Users can create custom event types"
  on event_types for insert to authenticated
  with check (created_by = auth.uid() and is_system = false);

create policy "Users can update own custom event types"
  on event_types for update to authenticated
  using (created_by = auth.uid() and is_system = false);

create policy "Users can delete own custom event types"
  on event_types for delete to authenticated
  using (created_by = auth.uid() and is_system = false);

-- Seed system event types
insert into event_types (name, icon, is_system) values
  ('Vacances', 'BeachAccess', true),
  ('Disponible', 'EventAvailable', true),
  ('Voyage', 'Flight', true)
on conflict do nothing;

-- ============================================
-- EVENTS
-- ============================================
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  event_type_id uuid references event_types(id),
  title text not null,
  description text,
  location text,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  is_all_day boolean default true,
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint events_date_order check (end_date >= start_date),
  constraint events_time_required check (
    is_all_day = true
    or (start_time is not null and end_time is not null)
  )
);

alter table events enable row level security;

create policy "Users can manage own events"
  on events for all to authenticated
  using (user_id = auth.uid());

create policy "Group members can view non-private events of co-members"
  on events for select to authenticated
  using (
    is_private = false
    and user_id in (
      select gm2.user_id from group_members gm1
      join group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
    )
  );

-- ============================================
-- INVITATIONS
-- ============================================
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  invited_email text not null,
  invited_by uuid references profiles(id) not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

alter table invitations enable row level security;

create policy "Group members can view invitations for their groups"
  on invitations for select to authenticated
  using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "Group admins can create invitations"
  on invitations for insert to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
    and invited_by = auth.uid()
  );

create policy "Invited users can accept their invitations"
  on invitations for update to authenticated
  using (
    invited_email = (select email from auth.users where id = auth.uid())
    and status = 'pending'
  )
  with check (
    status = 'accepted'
  );

create policy "Group admins can delete invitations"
  on invitations for delete to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- HELPER: Auto-update updated_at
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger groups_updated_at before update on groups
  for each row execute function update_updated_at();

create trigger events_updated_at before update on events
  for each row execute function update_updated_at();

-- ============================================
-- HELPER: Find group by invite code (SECURITY DEFINER)
-- Allows non-members to look up a group by its secret invite code
-- ============================================
create or replace function find_group_by_invite_code(code_param text)
returns table(id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name
  from groups g
  where g.invite_code = code_param
  limit 1;
$$;

-- ============================================
-- HELPER: Join group by invite code (SECURITY DEFINER)
-- Atomically finds group + inserts member + marks invitations accepted
-- ============================================
create or replace function join_group_by_invite_code(code_param text, member_color text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  group_record record;
  result_group_id uuid;
begin
  select g.id, g.name into group_record
  from groups g
  where g.invite_code = code_param;

  if group_record is null then
    raise exception 'Invalid invite code';
  end if;

  result_group_id := group_record.id;

  if exists (
    select 1 from group_members
    where group_id = result_group_id and user_id = auth.uid()
  ) then
    return result_group_id;
  end if;

  insert into group_members (group_id, user_id, role, color)
  values (result_group_id, auth.uid(), 'member', member_color);

  update invitations
  set status = 'accepted'
  where group_id = result_group_id
    and invited_email = (select email from auth.users where id = auth.uid())
    and status = 'pending';

  return result_group_id;
end;
$$;
