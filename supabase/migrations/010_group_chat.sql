-- ============================================
-- GROUP CHAT: Messages table
-- To remove this feature: drop this table and revert code changes
-- ============================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) > 0 and char_length(content) <= 2000),
  created_at timestamptz default now()
);

create index idx_messages_group_created on messages(group_id, created_at);

alter table messages enable row level security;

-- Only group members can read messages
create policy "Group members can view messages"
  on messages for select to authenticated
  using (is_group_member(group_id, auth.uid()));

-- Only group members can send messages
create policy "Group members can insert messages"
  on messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_group_member(group_id, auth.uid())
  );

-- Users can delete their own messages
create policy "Users can delete own messages"
  on messages for delete to authenticated
  using (user_id = auth.uid());

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
