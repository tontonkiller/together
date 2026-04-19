-- Migration 012: add calendar_granted flag to google_accounts
-- Supports granular consent (user can uncheck Calendar on Google consent screen).
-- Default true for existing rows — they were created via M9a which only
-- requested the Calendar scope, so all existing accounts had it granted.

alter table google_accounts
  add column if not exists calendar_granted boolean not null default true;

-- Index not needed : the banner query filters by user_id + a boolean,
-- the user_id filter already uses the existing idx on user_id.
