-- Fix: migration 004 referenced non-existent table "group_invitations"
-- instead of "invitations", causing join_group_by_invite_code to fail.

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

  -- Mark pending invitations as accepted (correct table name)
  update invitations
  set status = 'accepted'
  where group_id = result_group_id
    and invited_email = (select email from auth.users where id = auth.uid())
    and status = 'pending';

  return result_group_id;
end;
$$;
