@AGENTS.md

## Supabase RLS Rules

When writing or modifying RLS policies, always check for:

1. **INSERT + SELECT combo**: `.insert().select()` requires the row to pass BOTH the INSERT and SELECT policies. The SELECT policy must allow the creator to read the row they just inserted (e.g. `created_by = auth.uid()`).
2. **Cross-table recursion**: If table A's policy references table B, and table B's policy references table A, it will cause infinite recursion. Use `SECURITY DEFINER` helper functions to break the cycle.
3. **Self-referencing policies**: A SELECT policy on `group_members` that queries `group_members` will recurse. Use a `SECURITY DEFINER` function instead.
4. **Always test policies** by running the actual Supabase query in the SQL Editor before deploying:
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"sub": "<user-uuid>"}';
   -- then test the INSERT/SELECT/UPDATE/DELETE
   ```

## Workflow Rules

### Milestone QA Protocol
At the end of every milestone, run **3 successive passes** of both QA and Debug agents (in parallel each pass). After all 3 passes, fix every issue found before moving on. This is mandatory and must never be skipped.
