-- Allow members to update their own color in a group
create policy "Members can update their own color"
  on group_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = user_id and group_id = group_id);
