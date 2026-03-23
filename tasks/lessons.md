# Lessons Learned

## RLS Policy Mistakes

### 1. INSERT + SELECT combo (2026-03-23)
**Bug**: Creating a group failed with "new row violates row-level security policy for table groups"
**Root cause**: `.insert().select('id')` requires both INSERT and SELECT policies to pass. The SELECT policy only checked `group_members`, but the creator wasn't a member yet.
**Fix**: Added `created_by = auth.uid()` to the groups SELECT policy.
**Rule**: Always check if the SELECT policy allows the inserter to read back their own row.

### 2. Infinite recursion in RLS (2026-03-23)
**Bug**: "infinite recursion detected in policy for relation group_members"
**Root cause**: `group_members` INSERT policy checked `groups.created_by`, but `groups` SELECT policy checked `group_members` → infinite loop.
**Fix**: Created `SECURITY DEFINER` helper functions to bypass RLS for internal policy checks.
**Rule**: Never reference table B in table A's policy if table B's policy references table A. Use `SECURITY DEFINER` functions to break cycles.

### 3. Joins silently return null when RLS blocks (2026-03-23)
**Bug**: Dashboard showed groups without names — just an empty card with an icon.
**Root cause**: The dashboard query joins `group_members → groups`, but the `groups` SELECT policy blocked the join. Supabase returns `null` for the joined data instead of an error.
**Rule**: When a query joins tables, verify that RLS SELECT policies on ALL joined tables pass for the current user.

## General Mistakes

### 4. Don't guess, verify (2026-03-23)
**Bug**: Suggested the Supabase key format was wrong when the real issue was RLS.
**Rule**: When a user reports a bug, trace the exact error message to its root cause. Don't speculate about unrelated systems. The user was right: "if login worked, the key is fine."
