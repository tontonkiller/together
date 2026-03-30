# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest run (all tests)
npm run test:watch   # Vitest watch mode
npx vitest run src/path/to/file.test.ts  # Single test file
```

## Tech Stack

- **Framework**: Next.js 16.2 (App Router) + React 19 + TypeScript 5
- **UI**: MUI v7 (Material UI) + Emotion
- **Backend**: Supabase (Auth magic link, PostgreSQL, RLS, SECURITY DEFINER functions)
- **i18n**: next-intl v4 (FR/EN, locale routing, default locale: `fr`)
- **Tests**: Vitest 4 + Testing Library (React) + jsdom
- **Lint**: ESLint 9 + eslint-config-next
- **Deploy**: Vercel (preview deployments on branches, production on main)
- **PWA**: manifest.ts, icons 192/512, service worker (network-first for navigation)

## Architecture

### Routing & Locale

All routes live under `src/app/[locale]/`. Locale is `fr` or `en`, generated via `generateStaticParams`.

- `(authenticated)/` — route group for protected pages (dashboard, groups, calendar, profile, google-sync)
- `login/` — public login page
- `auth/callback/` — Supabase magic link callback
- `invite/[code]/` — invite link verification
- `api/` — API routes (Google OAuth, sync, invite)

Auth is checked **per page** in server components (not middleware): each page calls `createClient()` → `getUser()` → redirects to `/login` if no user.

### SSR + MUI Hydration

The locale layout (`src/app/[locale]/layout.tsx`) sets up the provider chain:

```
AppRouterCacheProvider (Emotion SSR — MUST be direct child of server component)
  → NextIntlClientProvider (i18n messages)
    → ThemeRegistry (MUI ThemeProvider + CssBaseline + Eva mode toggle)
```

`AppRouterCacheProvider` from `@mui/material-nextjs/v16-appRouter` injects Emotion `<style>` tags into the SSR stream via `useServerInsertedHTML`. Nesting it inside another client component breaks style injection and causes FOUC/hydration mismatches.

### Supabase Clients

- **Server components**: `import { createClient } from '@/lib/supabase/server'` — uses cookies
- **Client components**: `import { createClient } from '@/lib/supabase/client'` — browser client
- **Middleware**: `src/lib/supabase/middleware.ts` has `updateSession()` for session refresh

### i18n

- Messages: `src/lib/i18n/messages/{fr,en}.json`
- Navigation helpers (i18n-aware): `import { Link, redirect, useRouter, usePathname } from '@/lib/i18n/navigation'`
- In client components: `useTranslations('namespace')` and `useLocale()` from `next-intl`
- Config loaded via `withNextIntl()` plugin in `next.config.ts`

### Layout Structure (Authenticated Pages)

`AuthenticatedLayout` (`src/components/layout/AuthenticatedLayout.tsx`) wraps all protected routes:
```
Box (flex column, min-height 100vh)
  → TopBar (64px)
  → AutoSync (Google Calendar sync on mount)
  → main Box > Container maxWidth="md"
      → {page content}
  → BottomNav (64px, fixed bottom)
```

### Database (Supabase)

Schema in `supabase/schema.sql`. Migrations in `supabase/migrations/`.

Key tables: `profiles`, `groups`, `group_members` (with `color` and `role`), `invitations`, `events`, `event_types`, `google_accounts`, `google_synced_events`, `google_selected_calendars`.

Key functions: `join_group_by_invite_code()`, `get_member_color()`, `is_group_member()`, `count_group_members()` (SECURITY DEFINER to bypass RLS).

### Google Calendar Sync

- Full spec: `tasks/google-sync-spec.md`
- One-way sync Google → Together, multi-accounts, sync on app open, 6 months rolling
- OAuth flow: `src/app/[locale]/api/google/` routes
- Sync engine: `src/lib/google/sync.ts`, token management: `src/lib/google/tokens.ts`

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.

## Debugging

When fixing rendering/hydration bugs, investigate ALL potential root causes before pushing a fix:
1. Locale mismatches (`toLocaleDateString(undefined)` → pass explicit locale from `useLocale()`)
2. Missing MUI/Emotion SSR config (`AppRouterCacheProvider` must be direct child of server component)
3. `loading.tsx` Suspense boundaries can cause streaming SSR issues — if content duplicates on refresh, try removing the loading.tsx
4. `new Date()` in component body causes server/client timezone mismatch — use lazy state initializers
5. `typeof window !== 'undefined'` checks that change rendered output — use `useEffect` instead
6. Browser/service worker caching

Do not push partial fixes — create a checklist of all possible causes first.

## CSS/Styling

- For calendar grid layouts, always use `minmax(0, 1fr)` instead of `1fr` to prevent overflow on mobile
- Always test mobile viewport after calendar changes
- Member colors: 15-color palette in `src/lib/utils/colors.ts`, also mirrored in `get_member_color()` SQL function

## Supabase RLS Rules

When writing or modifying RLS policies, always check for:

1. **INSERT + SELECT combo**: `.insert().select()` requires the row to pass BOTH the INSERT and SELECT policies
2. **Cross-table recursion**: If table A's policy references table B, and table B's policy references table A → infinite recursion. Use `SECURITY DEFINER` helper functions to break the cycle
3. **Self-referencing policies**: A SELECT policy on `group_members` that queries `group_members` will recurse. Use a `SECURITY DEFINER` function instead
4. **Supabase joins and RLS**: When a query joins table A → table B, the RLS SELECT policy on table B must also pass. If it doesn't, Supabase returns `null` silently
5. **Always test policies** in SQL Editor before deploying:
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"sub": "<user-uuid>"}';
   -- then test the INSERT/SELECT/UPDATE/DELETE
   ```

## Workflow Rules

### Plan Mode
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately

### Verification Before Done
- Never mark a task complete without proving it works
- Run tests, check logs, demonstrate correctness

### Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Go fix failing CI tests without being told how

### Milestone QA Protocol
At the end of every milestone, run **3 successive passes** of both QA and Debug agents (in parallel each pass). Fix every issue found before moving on.

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Track Progress**: Mark items complete as you go
3. **Capture Lessons**: Update `tasks/lessons.md` after corrections
