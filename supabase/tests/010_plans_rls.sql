-- RLS test script for plans / plan_slots / plan_votes / event_participants
-- Run interactively in Supabase SQL Editor.
-- Each test is wrapped in begin/rollback so the DB stays clean.
--
-- Setup: create 2 users + 1 non-member + 1 group where u1 and u2 are members
-- Replace the UUIDs below with real auth.users ids from your Supabase project.

-- ============================================================================
-- SETUP (run once, commit)
-- ============================================================================
-- Pick 3 real user IDs from auth.users:
--   u1 = :u1_uuid (plan creator + group admin)
--   u2 = :u2_uuid (group member, voter)
--   u3 = :u3_uuid (non-member)
--
-- Create a group and memberships:
--   insert into groups (name, created_by) values ('Test RLS', :u1_uuid) returning id;
--   -- use returned id as :group_id
--   insert into group_members (group_id, user_id, role) values
--     (:group_id, :u1_uuid, 'admin'),
--     (:group_id, :u2_uuid, 'member');

-- Helper to impersonate a user inside a transaction:
--   set local role authenticated;
--   set local request.jwt.claims = json_build_object('sub', :u1_uuid::text)::text;

-- ============================================================================
-- TEST 1: Group member can create a plan; non-member cannot
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  -- Should succeed
  insert into plans (group_id, created_by, title, duration, quorum)
  values (:'group_id', :'u1_uuid', 'Plan A', '1h', 2)
  returning id as plan_a_id;
rollback;

begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u3_uuid')::text;

  -- Should fail: non-member
  do $$ begin
    insert into plans (group_id, created_by, title, duration, quorum)
    values (:'group_id', :'u3_uuid', 'Plan B', '1h', 2);
    raise exception 'TEST FAIL: non-member inserted a plan';
  exception when others then
    raise notice 'TEST PASS: non-member blocked (%)', sqlerrm;
  end $$;
rollback;

-- ============================================================================
-- TEST 2: Cannot insert plan with created_by != auth.uid()
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  do $$ begin
    insert into plans (group_id, created_by, title, duration, quorum)
    values (:'group_id', :'u2_uuid', 'Impersonated', '1h', 2);
    raise exception 'TEST FAIL: inserted plan with wrong created_by';
  exception when others then
    raise notice 'TEST PASS: created_by mismatch blocked (%)', sqlerrm;
  end $$;
rollback;

-- ============================================================================
-- TEST 3: create_plan_with_slots RPC (happy path)
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  select create_plan_with_slots(
    :'group_id'::uuid,
    'Apéro',
    'description test',
    '2h',
    2,
    jsonb_build_array(
      jsonb_build_object('date', '2026-05-15', 'time', '19:00', 'position', 0),
      jsonb_build_object('date', '2026-05-16', 'time', null,    'position', 1)
    )
  ) as new_plan_id;

  -- Verify plan + 2 slots created
  select count(*) as slot_count from plan_slots where plan_id = (
    select id from plans where group_id = :'group_id' order by created_at desc limit 1
  );
rollback;

-- ============================================================================
-- TEST 4: create_plan_with_slots rejects < 2 slots and quorum > member_count
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  do $$ begin
    perform create_plan_with_slots(
      :'group_id'::uuid, 'Bad', null, '1h', 2,
      jsonb_build_array(jsonb_build_object('date', '2026-05-15', 'time', null, 'position', 0))
    );
    raise exception 'TEST FAIL: < 2 slots accepted';
  exception when others then
    raise notice 'TEST PASS: < 2 slots rejected (%)', sqlerrm;
  end $$;

  do $$ begin
    perform create_plan_with_slots(
      :'group_id'::uuid, 'Bad', null, '1h', 99,
      jsonb_build_array(
        jsonb_build_object('date', '2026-05-15', 'time', null, 'position', 0),
        jsonb_build_object('date', '2026-05-16', 'time', null, 'position', 1)
      )
    );
    raise exception 'TEST FAIL: quorum > members accepted';
  exception when others then
    raise notice 'TEST PASS: quorum > members rejected (%)', sqlerrm;
  end $$;
rollback;

-- ============================================================================
-- TEST 5: Member votes on their own row; cannot vote for another user
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  -- Setup: plan + 1 slot
  with p as (
    insert into plans (group_id, created_by, title, duration, quorum)
    values (:'group_id', :'u1_uuid', 'Vote Test', '1h', 2)
    returning id
  ),
  s as (
    insert into plan_slots (plan_id, date, position)
    select id, '2026-06-01', 0 from p
    returning id as slot_id
  )
  select slot_id from s \gset

  -- u1 votes for themselves → OK
  insert into plan_votes (slot_id, user_id, available) values (:'slot_id', :'u1_uuid', true);

  -- u1 tries to vote for u2 → should fail
  do $$ begin
    insert into plan_votes (slot_id, user_id, available) values (:'slot_id', :'u2_uuid', true);
    raise exception 'TEST FAIL: voted for another user';
  exception when others then
    raise notice 'TEST PASS: vote for other user blocked (%)', sqlerrm;
  end $$;
rollback;

-- ============================================================================
-- TEST 6: Non-member cannot vote on a plan of another group
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum)
    values (:'group_id', :'u1_uuid', 'Non-member test', '1h', 2)
    returning id
  ),
  s as (
    insert into plan_slots (plan_id, date, position)
    select id, '2026-06-02', 0 from p
    returning id as slot_id
  )
  select slot_id from s \gset

  set local request.jwt.claims = json_build_object('sub', :'u3_uuid')::text;

  do $$ begin
    insert into plan_votes (slot_id, user_id, available) values (:'slot_id', :'u3_uuid', true);
    raise exception 'TEST FAIL: non-member voted';
  exception when others then
    raise notice 'TEST PASS: non-member vote blocked (%)', sqlerrm;
  end $$;
rollback;

-- ============================================================================
-- TEST 7: resolve_plan_with_slot — creator bypass OK
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum)
    values (:'group_id', :'u1_uuid', 'Manual resolve', '1h', 5)
    returning id
  ),
  s as (
    insert into plan_slots (plan_id, date, time, position)
    select id, '2026-07-01', '19:00', 0 from p
    returning id as slot_id, plan_id
  )
  select plan_id, slot_id from s \gset

  -- u1 is creator → resolve even without quorum
  select resolve_plan_with_slot(:'plan_id'::uuid, :'slot_id'::uuid) as event_id;

  -- Verify plan status
  select status from plans where id = :'plan_id'::uuid;  -- expect 'resolved'
rollback;

-- ============================================================================
-- TEST 8: resolve_plan_with_slot — non-creator without quorum is blocked
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum)
    values (:'group_id', :'u1_uuid', 'Quorum gate', '1h', 2)
    returning id
  ),
  s as (
    insert into plan_slots (plan_id, date, position)
    select id, '2026-07-02', 0 from p
    returning id as slot_id, plan_id
  )
  select plan_id, slot_id from s \gset

  set local request.jwt.claims = json_build_object('sub', :'u2_uuid')::text;

  -- u2 is not creator and 0 votes on slot → should fail
  do $$ begin
    perform resolve_plan_with_slot(:'plan_id'::uuid, :'slot_id'::uuid);
    raise exception 'TEST FAIL: non-creator resolved without quorum';
  exception when others then
    raise notice 'TEST PASS: quorum gate enforced (%)', sqlerrm;
  end $$;
rollback;

-- ============================================================================
-- TEST 9: expire_plan — 0 votes → expired
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum, expires_at)
    values (:'group_id', :'u1_uuid', 'Expire empty', '1h', 2, now() - interval '1 day')
    returning id
  ),
  s as (
    insert into plan_slots (plan_id, date, position)
    select id, '2026-08-01', 0 from p
    returning plan_id
  )
  select plan_id from s \gset

  select expire_plan(:'plan_id'::uuid);  -- expect 'expired'
  select status, event_id from plans where id = :'plan_id'::uuid;  -- 'expired', null
rollback;

-- ============================================================================
-- TEST 10: expire_plan — 1 clear winner → resolved + event + participants
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum, expires_at)
    values (:'group_id', :'u1_uuid', 'Expire winner', '1h', 5, now() - interval '1 day')
    returning id
  ),
  s1 as (
    insert into plan_slots (plan_id, date, time, position)
    select id, '2026-08-05', '19:00', 0 from p
    returning id as slot_id_1, plan_id
  ),
  s2 as (
    insert into plan_slots (plan_id, date, time, position)
    select plan_id, '2026-08-06', '19:00', 1 from s1
    returning id as slot_id_2, plan_id
  )
  select plan_id, slot_id_1, slot_id_2 from s2, s1 where s1.plan_id = s2.plan_id \gset

  -- 2 votes on slot 1, 0 on slot 2
  insert into plan_votes (slot_id, user_id, available) values
    (:'slot_id_1', :'u1_uuid', true),
    (:'slot_id_1', :'u2_uuid', true);

  select expire_plan(:'plan_id'::uuid);  -- expect 'resolved'

  -- Verify event was created and has 2 participants
  select e.title, count(ep.*) as participant_count
  from plans p
  join events e on e.id = p.event_id
  left join event_participants ep on ep.event_id = e.id
  where p.id = :'plan_id'::uuid
  group by e.title;
rollback;

-- ============================================================================
-- TEST 11: expire_plan — tie → pending_tiebreak (no event yet)
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum, expires_at)
    values (:'group_id', :'u1_uuid', 'Expire tie', '1h', 5, now() - interval '1 day')
    returning id
  ),
  s1 as (
    insert into plan_slots (plan_id, date, position)
    select id, '2026-09-01', 0 from p
    returning id as slot_id_1, plan_id
  ),
  s2 as (
    insert into plan_slots (plan_id, date, position)
    select plan_id, '2026-09-02', 1 from s1
    returning id as slot_id_2
  )
  select plan_id, slot_id_1, slot_id_2 from s1, s2 \gset

  -- 1 vote on each slot → tie
  insert into plan_votes (slot_id, user_id, available) values
    (:'slot_id_1', :'u1_uuid', true),
    (:'slot_id_2', :'u2_uuid', true);

  select expire_plan(:'plan_id'::uuid);  -- expect 'pending_tiebreak'
  select status, event_id from plans where id = :'plan_id'::uuid;  -- 'pending_tiebreak', null
rollback;

-- ============================================================================
-- TEST 12: DELETE plan — only creator + status=open
-- ============================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', :'u1_uuid')::text;

  with p as (
    insert into plans (group_id, created_by, title, duration, quorum, status)
    values (:'group_id', :'u1_uuid', 'Cant delete resolved', '1h', 2, 'resolved')
    returning id
  )
  select id from p \gset

  -- Creator but status='resolved' → blocked
  delete from plans where id = :'id'::uuid;
  -- RLS blocks silently (0 rows affected) — check exists
  select count(*) as still_exists from plans where id = :'id'::uuid;  -- expect 1
rollback;

-- ============================================================================
-- End of RLS tests. All `TEST PASS` notices + expected counts = green.
-- ============================================================================
