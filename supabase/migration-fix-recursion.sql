-- ============================================
-- Fix: infinite recursion in group_members INSERT policy
-- The INSERT policy checks groups.created_by, but groups SELECT policy
-- checks group_members → infinite recursion.
-- Solution: use SECURITY DEFINER functions to bypass RLS for internal checks.
-- ============================================

-- Helper: check if user created the group (bypasses RLS)
create or replace function is_group_creator(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from groups where id = p_group_id and created_by = p_user_id
  );
$$;

-- Helper: check if user has a pending invitation for the group (bypasses RLS)
create or replace function has_pending_invitation(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from invitations
    where group_id = p_group_id
      and invited_email = (select email from auth.users where id = p_user_id)
      and status = 'pending'
      and expires_at > now()
  );
$$;

-- Helper: check if user is member of a group (bypasses RLS for SELECT policy)
create or replace function is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = p_user_id
  );
$$;

-- Drop the recursive policies
drop policy if exists "Users can join groups via invitation or as creator" on group_members;
drop policy if exists "Group members can view other members in their groups" on group_members;

-- Recreate SELECT policy using helper function (no recursion)
create policy "Group members can view other members in their groups"
  on group_members for select to authenticated
  using (
    is_group_member(group_id, auth.uid())
  );

-- Recreate INSERT policy using helper functions (no recursion)
create policy "Users can join groups via invitation or as creator"
  on group_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      is_group_creator(group_id, auth.uid())
      or has_pending_invitation(group_id, auth.uid())
    )
  );
