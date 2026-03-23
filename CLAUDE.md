@AGENTS.md

## Tech Stack

- **Framework**: Next.js 16.2 (App Router) + React 19 + TypeScript 5
- **UI**: MUI v7 (Material UI) + Emotion
- **Backend**: Supabase (Auth magic link, PostgreSQL, RLS, SECURITY DEFINER functions)
- **i18n**: next-intl v4 (FR/EN, locale routing)
- **Tests**: Vitest 4 + Testing Library (React) + jsdom
- **Lint**: ESLint 9 + eslint-config-next
- **Deploy**: Vercel (preview deployments on branches, production on main)
- **PWA**: manifest.ts, icônes 192/512

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.

## Workflow Rules

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### Milestone QA Protocol
At the end of every milestone, run **3 successive passes** of both QA and Debug agents (in parallel each pass). After all 3 passes, fix every issue found before moving on. This is mandatory and must never be skipped.

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Supabase RLS Rules

When writing or modifying RLS policies, always check for:

1. **INSERT + SELECT combo**: `.insert().select()` requires the row to pass BOTH the INSERT and SELECT policies. The SELECT policy must allow the creator to read the row they just inserted (e.g. `created_by = auth.uid()`).
2. **Cross-table recursion**: If table A's policy references table B, and table B's policy references table A, it will cause infinite recursion. Use `SECURITY DEFINER` helper functions to break the cycle.
3. **Self-referencing policies**: A SELECT policy on `group_members` that queries `group_members` will recurse. Use a `SECURITY DEFINER` function instead.
4. **Supabase joins and RLS**: When a query joins table A → table B, the RLS SELECT policy on table B must also pass. If it doesn't, Supabase returns `null` for the joined data silently (no error).
5. **Always test policies** by running the actual Supabase query in the SQL Editor before deploying:
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"sub": "<user-uuid>"}';
   -- then test the INSERT/SELECT/UPDATE/DELETE
   ```
