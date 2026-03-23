-- M6: Allow co-members to see private events (displayed as "Busy" in the UI)
-- Previously, private events were completely hidden from co-members by RLS.
-- Now co-members can SELECT all events; the client redacts private event titles.

drop policy if exists "Group members can view non-private events of co-members" on events;

create policy "Group members can view all events of co-members"
  on events for select to authenticated
  using (
    user_id in (
      select gm2.user_id from group_members gm1
      join group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
    )
  );
