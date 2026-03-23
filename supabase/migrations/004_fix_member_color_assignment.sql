-- Fix: member colors were all the same because:
-- 1. Creator gets default '#1976D2' instead of palette color
-- 2. Invite route can't count members (RLS blocks non-members)
--
-- Solution: SECURITY DEFINER function to count members,
-- and update join_group_by_invite_code to auto-assign color from palette.

-- Color palette (must match src/lib/utils/colors.ts MEMBER_COLORS)
-- Index: 0=#1976D2, 1=#D32F2F, 2=#388E3C, 3=#7B1FA2, 4=#F57C00,
--        5=#00838F, 6=#C2185B, 7=#455A64, 8=#AFB42B, 9=#5D4037

create or replace function get_member_color(member_index int)
returns text
language sql
immutable
as $$
  select (array[
    '#1976D2', '#D32F2F', '#388E3C', '#7B1FA2', '#F57C00',
    '#00838F', '#C2185B', '#455A64', '#AFB42B', '#5D4037'
  ])[1 + (member_index % 10)];
$$;

-- Count members in a group (bypasses RLS for invite flow)
create or replace function count_group_members(group_id_param uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from group_members where group_id = group_id_param;
$$;

-- Update join function to auto-assign color from palette
create or replace function join_group_by_invite_code(code_param text, member_color text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  group_record record;
  result_group_id uuid;
  actual_color text;
  member_count int;
begin
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

  -- Auto-assign color from palette based on current member count
  select count(*)::int into member_count
  from group_members
  where group_id = result_group_id;

  actual_color := coalesce(
    nullif(member_color, ''),
    get_member_color(member_count)
  );

  insert into group_members (group_id, user_id, role, color)
  values (result_group_id, auth.uid(), 'member', actual_color);

  -- Mark pending invitations as accepted
  update invitations
  set status = 'accepted'
  where group_id = result_group_id
    and invited_email = (select email from auth.users where id = auth.uid())
    and status = 'pending';

  return result_group_id;
end;
$$;

-- ============================================
-- DATA FIX: Reassign distinct colors to existing members
-- Each member within a group gets a unique palette color based on join order
-- ============================================
update group_members gm
set color = get_member_color(sub.rn)
from (
  select id, (row_number() over (partition by group_id order by joined_at) - 1)::int as rn
  from group_members
) sub
where gm.id = sub.id;
