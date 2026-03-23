-- Fix: group creator can't read their own group right after creating it
-- because the SELECT policy only checks group_members (not yet inserted).
-- Solution: also allow the creator to see their own groups.

drop policy if exists "Group members can view their groups" on groups;

create policy "Group members and creators can view their groups"
  on groups for select to authenticated
  using (
    created_by = auth.uid()
    or id in (select group_id from group_members where user_id = auth.uid())
  );
