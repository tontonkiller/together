-- Migration: Add SECURITY DEFINER functions for invite code flow
-- These functions bypass RLS to allow non-members to look up groups by invite code
-- and join them.

-- 1. Find a group by its invite_code (safe: invite_code is a secret)
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

-- 2. Join a group by invite_code (atomic: finds group + inserts member)
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
  -- Find group by invite code
  select g.id, g.name into group_record
  from groups g
  where g.invite_code = code_param;

  if group_record is null then
    raise exception 'Invalid invite code';
  end if;

  result_group_id := group_record.id;

  -- Check if already a member
  if exists (
    select 1 from group_members
    where group_id = result_group_id and user_id = auth.uid()
  ) then
    return result_group_id;
  end if;

  -- Insert as member
  insert into group_members (group_id, user_id, role, color)
  values (result_group_id, auth.uid(), 'member', member_color);

  -- Mark any pending invitations as accepted
  update invitations
  set status = 'accepted'
  where group_id = result_group_id
    and invited_email = (select email from auth.users where id = auth.uid())
    and status = 'pending';

  return result_group_id;
end;
$$;
