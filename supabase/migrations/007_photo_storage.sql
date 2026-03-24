-- M10: Photo storage — user avatars + group photos
-- Adds avatar_url to groups and creates storage buckets with RLS

-- ============================================
-- ADD avatar_url TO GROUPS
-- ============================================
alter table groups add column if not exists avatar_url text;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('group-avatars', 'group-avatars', true)
on conflict (id) do nothing;

-- ============================================
-- STORAGE RLS: avatars bucket
-- Path convention: avatars/{user_id}/avatar.jpg
-- ============================================
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

-- ============================================
-- STORAGE RLS: group-avatars bucket
-- Path convention: group-avatars/{group_id}/avatar.jpg
-- ============================================
create policy "Group admins can upload group avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'group-avatars'
    and (storage.foldername(name))[1] in (
      select group_id::text from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can update group avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'group-avatars'
    and (storage.foldername(name))[1] in (
      select group_id::text from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can delete group avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'group-avatars'
    and (storage.foldername(name))[1] in (
      select group_id::text from group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Anyone can view group avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'group-avatars');
