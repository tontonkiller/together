-- ============================================
-- Migration: Apply QA audit fixes
-- Run this AFTER the initial schema (étapes 1 & 2)
-- ============================================

-- 1. Index on group_members(user_id) for RLS performance
create index if not exists idx_group_members_user_id on group_members(user_id);

-- 2. Fix group_members INSERT policy: restrict to creators and invited users
-- Drop the old permissive policy
drop policy if exists "Users can join groups (insert themselves)" on group_members;
-- Create the restricted one
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

-- 3. Fix group_members UPDATE policy: add WITH CHECK
drop policy if exists "Group admins can update members" on group_members;
create policy "Group admins can update members"
  on group_members for update to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    user_id = user_id
    and group_id = group_id
  );

-- 4. Add constraints on events
alter table events add constraint events_date_order
  check (end_date >= start_date);
alter table events add constraint events_time_required
  check (is_all_day = true or (start_time is not null and end_time is not null));

-- 5. Fix events visibility policy: enforce is_private = false
drop policy if exists "Group members can view non-private events of co-members" on events;
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

-- 6. Make invitations.invited_email NOT NULL
alter table invitations alter column invited_email set not null;

-- 7. Add update/delete policies for event_types
create policy "Users can update own custom event types"
  on event_types for update to authenticated
  using (created_by = auth.uid() and is_system = false);
create policy "Users can delete own custom event types"
  on event_types for delete to authenticated
  using (created_by = auth.uid() and is_system = false);

-- 8. Add update/delete policies for invitations
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
