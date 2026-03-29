# Together — Full Specifications

> Shared calendar application for families and groups.
> Last updated: March 29, 2026

---

## Table of Contents

1. [Vision & Purpose](#1-vision--purpose)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Authentication](#4-authentication)
5. [User Profile](#5-user-profile)
6. [Groups](#6-groups)
7. [Invitations](#7-invitations)
8. [Events](#8-events)
9. [Calendar](#9-calendar)
10. [Google Calendar Sync](#10-google-calendar-sync)
11. [Bob — Voice Assistant](#11-bob--voice-assistant)
12. [Themes](#12-themes)
13. [Internationalization (i18n)](#13-internationalization-i18n)
14. [PWA](#14-pwa)
15. [Database](#15-database)
16. [API Routes](#16-api-routes)
17. [Pages & Navigation](#17-pages--navigation)
18. [Security (RLS)](#18-security-rls)
19. [Tests](#19-tests)
20. [Deployment](#20-deployment)

---

## 1. Vision & Purpose

**Together** enables families, friend groups, or clubs to share a common calendar. Each member sees all co-members' events on a unified view.

**Value Proposition:**
- Create shared calendars per group
- View all members' events at a glance
- Import events from Google Calendar
- Create events by voice (Bob assistant)
- Installable as a native app (PWA)

---

## 2. Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 16.2 (App Router) | Full-stack React with Server Components |
| Frontend | React 19 + TypeScript 5 | UI components + type safety |
| UI | MUI v7 + Emotion | Material Design + CSS-in-JS |
| Backend | Supabase (PostgreSQL) | Database + Auth + RLS + Storage |
| Auth | Supabase Auth | Magic link + Google OAuth 2.0 |
| i18n | next-intl v4 | Locale routing + translations |
| Tests | Vitest 4 + Testing Library | Unit tests + React testing |
| Lint | ESLint 9 + eslint-config-next | Code quality |
| Deployment | Vercel | Serverless hosting |
| AI / Voice | Claude API + OpenAI Whisper | Event parsing + transcription |
| Google APIs | Google Calendar API v3 | Calendar sync |

---

## 3. Architecture

### Project Structure

```
src/
├── app/
│   ├── [locale]/                      # Locale routing (fr/en)
│   │   ├── (authenticated)/           # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── groups/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── calendar/
│   │   │   ├── google-sync/
│   │   │   └── bob/
│   │   ├── login/
│   │   └── invite/[code]/
│   ├── api/
│   │   ├── [locale]/auth/callback/
│   │   ├── google/
│   │   │   ├── connect/
│   │   │   ├── callback/
│   │   │   ├── calendars/
│   │   │   ├── sync/
│   │   │   └── disconnect/
│   │   ├── bob/
│   │   │   ├── transcribe/
│   │   │   ├── parse/
│   │   │   └── create/
│   │   └── invite/[code]/
│   ├── layout.tsx
│   └── manifest.ts
├── components/
│   ├── layout/          (TopBar, BottomNav, AuthenticatedLayout, ThemeRegistry)
│   ├── google/          (AutoSync)
│   ├── pwa/             (ServiceWorkerRegistration)
│   └── error/           (RouteErrorBoundary)
├── lib/
│   ├── google/          (sync, calendar, tokens, getAccessToken)
│   ├── supabase/        (client, server, middleware)
│   ├── i18n/            (config, routing, navigation, messages/)
│   ├── types/           (events.ts)
│   ├── hooks/           (useImageUpload)
│   ├── utils/           (colors)
│   └── theme.ts
└── __tests__/           (24 files, 219+ tests)

supabase/
├── schema.sql
└── migrations/          (10 migrations)

public/
├── icons/               (192x192, 512x512)
└── sw.js                (Service Worker)
```

---

## 4. Authentication

### Magic Link (Email OTP)

1. User enters their email on `/login`
2. Supabase sends an email with an OTP link
3. Click on the link → `/{locale}/auth/callback?code=...`
4. The API exchanges the code for a session
5. Auto-creates profile on first login (display_name = email prefix)
6. Redirects to `/dashboard` (or `?next=` parameter)

### Google OAuth

1. Click "Continue with Google" on `/login`
2. Supabase initiates the OAuth flow with Google
3. After consent, callback to `/{locale}/auth/callback`
4. Same flow as magic link (exchange code → session → profile)

### Session Management

- Session managed by Supabase on both client and server side
- Next.js middleware refreshes the session on each request
- Logout available from the profile page

---

## 5. User Profile

**Page:** `/profile`

| Field | Type | Editable | Storage |
|-------|------|----------|---------|
| Display name | Text | Yes | Supabase (profiles) |
| Email | Text | No (read-only) | auth.users |
| Avatar | Image | Yes (upload) | Supabase Storage (`avatars` bucket) |
| Language | FR / EN | Yes | Supabase (profiles.preferred_locale) |

### Avatar Upload

- Client-side resizing (256x256)
- Stored in Supabase Storage: `avatars/{user_id}/avatar.jpg`
- Custom hook `useImageUpload`

### Connected Google Accounts

- List of linked Google accounts (email displayed)
- "Connect a Google account" button → OAuth
- "Disconnect" button → cascading deletion
- Per-account calendar selection (checkboxes)

---

## 6. Groups

### Creation

1. Click "New Group" from the dashboard
2. Enter name (required) and description (optional)
3. The creator automatically becomes **admin**
4. A unique invite code is generated (6 bytes → hex, 12 characters)
5. Redirect to the group detail page

### Roles

| Role | Permissions |
|------|------------|
| **Admin** | Invite, rename, edit description, kick members, delete group, manage invitations |
| **Member** | View group, leave, create events, see co-members |

### Admin Features

- **Rename group**: inline dialog (name + description)
- **Edit description**: same dialog
- **Kick a member**: remove icon on non-admins, confirmation dialog
- **Delete group**: admin-only
- **Manage invitations**: view pending, revoke
- **Admin transfer**: automatic to the oldest member when admin leaves

### Group Avatar

- Image upload for the group
- Storage: `group-avatars/{group_id}/avatar.jpg`
- Only admins can update the avatar

### Member Colors

- 15 available colors: `#2196F3, #FF5252, #4CAF50, #FF9800, #AB47BC, #EC407A, #26C6DA, #FFCA28, #5D4037, #3F51B5, #26A69A, #FF7043, #78909C, #8BC34A, #F06292`
- Automatically assigned by join order
- Displayed in the member list and calendar filters

---

## 7. Invitations

### By Link

- Shareable URL: `/invite/{code}`
- If the user is authenticated → automatically joins the group
- If not authenticated → login page then redirect
- Member color auto-assigned from the palette

### By Email (Admin)

- Admin enters the email of the person to invite
- Creates an `invitations` record (expires after 7 days)
- Status: `pending` → `accepted` or `expired`
- Admin view: pending invitations + who invited them

### Expiration

- Validity period: **7 days** (SQL default: `now() + interval '7 days'`)
- Status automatically becomes `expired` after the date

---

## 8. Events

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | Text (max 200 chars) | Yes | Event name |
| Description | Text | No | Details |
| Location | Text | No | Location |
| Start date | Date | Yes | — |
| End date | Date | Yes | >= start date |
| Start time | Time | If not all-day | — |
| End time | Time | If not all-day | — |
| All day | Boolean | — | Default: true |
| Private | Boolean | — | Default: false |
| Type | Reference | No | Event type |

### Event Types (System)

| Name | MUI Icon | Description |
|------|----------|-------------|
| Vacances | BeachAccess | Holidays / vacation |
| Disponible | EventAvailable | Availability |
| Voyage | Flight | Travel / trip |

Users can also create **custom types**.

### Private Events

- Marked `is_private = true`
- Visible on co-members' calendars as **"Busy"** (title and details hidden client-side)
- RLS allows access — the **client** redacts the information

### CRUD

- **Create**: form with all fields
- **Edit**: only the owner can edit
- **Delete**: only the owner can delete
- **View**: click on an event → detail modal

---

## 9. Calendar

### Personal View (`/calendar`)

- Displays the user's own events + all co-members' events (across all groups)
- **Filters**:
  - By group (selectable chips)
  - By member (chips with member colors, toggle on/off)

### Group View (`/groups/[id]`)

- Displays all events from group members
- Same filters as the personal view

### Visual Rendering

| Event Type | Display |
|------------|---------|
| All-day | Full-width colored bar |
| Timed | Time prefix + colored left border |
| Google import | **"G"** badge |
| Private (co-member) | Title: "Busy" |

### Responsive

- Mobile (375px+): smaller calendar cells
- Desktop: expanded view with more details
- Full-screen dialogs on mobile

---

## 10. Google Calendar Sync

### Principles

- **One-way** sync: Google → Together
- **Multi-account** support (personal + work)
- Sync window: **6-month rolling**
- OAuth scope: `calendar.readonly`

### Connecting a Google Account

1. From `/profile`, click "Connect a Google account"
2. `POST /api/google/connect` → generates the OAuth URL
3. Google consent (scope `calendar.readonly`)
4. Callback `GET /api/google/callback` → saves tokens
5. Redirect to `/profile?connected=true`

### Calendar Selection

- User sees a list of their Google calendars
- Checkbox to enable/disable each calendar
- Only enabled calendars are synced

### Automatic Sync

- Triggered on **app open** (`AutoSync` component)
- **5-minute debounce** (via `localStorage`)
- Also manually triggerable from `/google-sync`

### Sync Engine (`src/lib/google/sync.ts`)

```
fetchAndSyncEvents(supabase, userId) → { newPending, updated, deleted }
```

For each enabled calendar:
1. Refreshes the access token if expired
2. Calls Google Calendar API: `events.list(timeMin, timeMax, singleEvents=true)`
3. Expands recurring events into individual instances
4. Compares with existing `google_synced_events`:
   - **New** → insert with `status = 'pending'`
   - **Updated** → update cached data; if accepted, update the Together event too
   - **Deleted on Google** → delete the Together event if accepted, then remove the sync record

### Suggestions Page (`/google-sync`)

- Lists synced events pending review (`status = 'pending'`)
- For each event:
  - Accept/refuse checkbox
  - Visibility choice: **"Details"** (full info) or **"Busy"**
- Bulk actions available
- Accept → creates the Together event + links via `event_id`

### Disconnecting a Google Account

1. Click "Disconnect" from `/profile`
2. Calls `delete_events_for_google_account()` function (SECURITY DEFINER)
3. Cascading deletion: Together events → synced events → calendars → Google account

### Token Management

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token | ~1 hour | `google_accounts.access_token` |
| Refresh token | Long-lived | `google_accounts.refresh_token` |
| Expiry | Tracked | `google_accounts.token_expires_at` |

---

## 11. Bob — Voice Assistant

**Page:** `/bob`

### Overview

Bob lets users create events by speaking in natural language.

### Flow

1. User taps the mic button
2. Browser requests microphone permission
3. Audio recording (WebM/Opus format)
4. Stop recording on tap
5. `POST /api/bob/transcribe` → Whisper API → transcribed text
6. `POST /api/bob/parse` → Claude API → structured event JSON
7. Confirmation card with parsed details
8. On confirm, `POST /api/bob/create` → event creation

### UI States

| State | Description |
|-------|-------------|
| `idle` | Ready to listen (tap mic) |
| `listening` | Recording in progress (tap to stop) |
| `processing` | Transcribing + parsing |
| `confirm` | Confirmation card displayed |
| `success` | Checkmark + auto-dismiss |
| `error` | Error message (mic permission, API error, no speech detected) |

### Validations

- Minimum audio size: 1000 bytes (silence detection)
- Title: required, max 200 characters
- Dates: YYYY-MM-DD format
- Times: HH:MM format
- Times required only if not all-day

### Technologies

- **Transcription**: OpenAI Whisper API
- **Parsing**: Anthropic Claude API
- Audio is sent to the server, no client-side processing

---

## 12. Themes

### Default Theme

- Cyan/teal Mediterranean palette
- Primary color: `#0891B2`
- Background: `#F0FAFB`

### Eva Theme

- Rose/pink sunset palette
- Activated via the heart icon in the TopBar (empty → filled)
- Persisted in `localStorage`
- Real-time switching (CSS-in-JS via Emotion)

### Implementation

- `ThemeRegistry` manages the Eva context
- Two complete MUI themes defined in `src/lib/theme.ts`
- Toggle in the `TopBar` (heart icon)

---

## 13. Internationalization (i18n)

### Configuration

- **Framework**: next-intl v4
- **Languages**: French (fr, default) and English (en)
- **Routing**: locale prefix (`/fr/dashboard`, `/en/dashboard`)

### Translation Files

- `src/lib/i18n/messages/fr.json`
- `src/lib/i18n/messages/en.json`
- ~100+ translation keys

### Namespaces

| Namespace | Content |
|-----------|---------|
| `nav` | Navigation |
| `auth` | Authentication |
| `common` | Common UI |
| `groups` | Groups |
| `events` | Events |
| `calendar` | Calendar |
| `googleSync` | Google Sync |
| `bob` | Voice Assistant |
| `invite` | Invitations |

### Usage

```tsx
const t = useTranslations('namespace');
t('key');
```

### Language Selection

- Selector in the TopBar
- Changes the locale in the URL + updates `profiles.preferred_locale`

---

## 14. PWA

### Manifest (`src/app/manifest.ts`)

| Property | Value |
|----------|-------|
| name | Together |
| short_name | Together |
| start_url | /dashboard |
| display | standalone |
| theme_color | #0891B2 |
| background_color | #F0FAFB |
| Icons | 192x192 (maskable) + 512x512 (any) |

### Service Worker (`public/sw.js`)

| Strategy | Targets |
|----------|---------|
| Cache-first | Static assets (CSS, JS, fonts) |
| Network-first | Navigation + API requests |
| Offline fallback | Fallback page |

### Installation

- **iOS**: "Add to Home Screen" (via meta tags)
- **Android**: Native install prompt + manifest

### Local Storage

| Data | Mechanism |
|------|-----------|
| Theme preference | localStorage (`eva_mode`) |
| Google sync debounce | localStorage (`lastGoogleSync`) |
| Auth session | Supabase (cookies) |

---

## 15. Database

### Schema (9 tables)

#### profiles
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK, FK → auth.users ON DELETE CASCADE |
| display_name | text | NOT NULL |
| avatar_url | text | nullable |
| preferred_locale | text | 'fr' or 'en', default 'fr' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto trigger |

#### groups
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | text | NOT NULL |
| description | text | nullable |
| avatar_url | text | nullable |
| created_by | uuid | FK → profiles, NOT NULL |
| invite_code | text | UNIQUE, 12-char hex |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto trigger |

#### group_members
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| group_id | uuid | FK → groups ON DELETE CASCADE |
| user_id | uuid | FK → profiles ON DELETE CASCADE |
| role | text | 'admin' or 'member', default 'member' |
| color | text | Member hex color |
| joined_at | timestamptz | auto |
| **UNIQUE** | (group_id, user_id) | |
| **INDEX** | idx_group_members_user_id | |

#### event_types
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| name | text | NOT NULL |
| icon | text | nullable (MUI icon name) |
| is_system | boolean | default false |
| created_by | uuid | FK → profiles, nullable |
| created_at | timestamptz | auto |

**Pre-loaded system types**: Vacances, Disponible, Voyage

#### events
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles ON DELETE CASCADE |
| event_type_id | uuid | FK → event_types, nullable |
| title | text | NOT NULL |
| description | text | nullable |
| location | text | nullable |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL, >= start_date |
| start_time | time | nullable (required if not all-day) |
| end_time | time | nullable (required if not all-day) |
| is_all_day | boolean | default true |
| is_private | boolean | default false |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto trigger |

#### invitations
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| group_id | uuid | FK → groups ON DELETE CASCADE |
| invited_email | text | NOT NULL |
| invited_by | uuid | FK → profiles |
| status | text | 'pending' / 'accepted' / 'expired', default 'pending' |
| expires_at | timestamptz | default now() + 7 days |
| created_at | timestamptz | auto |

#### google_accounts
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles ON DELETE CASCADE |
| google_email | text | NOT NULL |
| refresh_token | text | NOT NULL |
| access_token | text | nullable |
| token_expires_at | timestamptz | nullable |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto trigger |
| **UNIQUE** | (user_id, google_email) | |

#### google_calendars
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| google_account_id | uuid | FK → google_accounts ON DELETE CASCADE |
| google_calendar_id | text | NOT NULL |
| name | text | NOT NULL |
| color | text | nullable |
| is_enabled | boolean | default true |
| created_at | timestamptz | auto |
| **UNIQUE** | (google_account_id, google_calendar_id) | |

#### google_synced_events
| Column | Type | Constraint |
|--------|------|------------|
| id | uuid | PK |
| google_calendar_id | uuid | FK → google_calendars ON DELETE CASCADE |
| google_event_id | text | NOT NULL |
| event_id | uuid | FK → events ON DELETE SET NULL, nullable |
| status | text | 'pending' / 'accepted' / 'refused', default 'pending' |
| visibility | text | 'details' / 'busy', default 'details' |
| title | text | nullable |
| description | text | nullable |
| location | text | nullable |
| start_date | date | |
| end_date | date | |
| start_time | time | nullable |
| end_time | time | nullable |
| is_all_day | boolean | |
| is_recurring | boolean | |
| recurring_event_id | text | nullable |
| google_updated_at | timestamptz | |
| last_synced_at | timestamptz | default now() |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto trigger |
| **UNIQUE** | (google_calendar_id, google_event_id) | |
| **INDEX** | idx_google_synced_events_calendar_event | |
| **INDEX** | idx_google_synced_events_event_id | |

### SECURITY DEFINER Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `is_group_creator(group_id, user_id)` | boolean | Checks if user created the group |
| `has_pending_invitation(group_id, user_id)` | boolean | Checks if user has a pending invitation |
| `is_group_member(group_id, user_id)` | boolean | Checks group membership |
| `is_own_google_account(google_account_id)` | boolean | Checks if Google account belongs to user |
| `is_own_google_calendar(google_calendar_id)` | boolean | Checks if calendar belongs to user |
| `find_group_by_invite_code(code)` | table(id, name) | Finds a group by invite code |
| `join_group_by_invite_code(code, color)` | uuid | Atomically joins a group |
| `count_group_members(group_id)` | int | Counts members in a group |
| `delete_events_for_google_account(account_id)` | void | Deletes all events imported from an account |
| `get_member_color(index)` | text | Returns color at given index (15-color palette) |

### Triggers

- **`update_updated_at()`**: sets `updated_at = now()` before each UPDATE on tables: profiles, groups, events, google_accounts, google_synced_events

### Storage Buckets

| Bucket | Access | Path Convention |
|--------|--------|----------------|
| `avatars` | Public | `avatars/{user_id}/avatar.jpg` |
| `group-avatars` | Public | `group-avatars/{group_id}/avatar.jpg` |

---

## 16. API Routes

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/[locale]/auth/callback` | Exchanges magic link/OAuth code for a session + auto-creates profile |

### Google Calendar

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/google/connect` | Generates the Google OAuth URL |
| GET | `/api/google/callback` | Google OAuth callback → saves tokens |
| GET | `/api/google/calendars` | Lists connected Google calendars |
| POST | `/api/google/calendars` | Saves calendar selection |
| POST | `/api/google/sync` | Triggers a manual sync |
| GET | `/api/google/sync/events` | Lists synced events (filterable by status) |
| POST | `/api/google/sync/events` | Accepts/refuses a synced event |
| POST | `/api/google/disconnect` | Disconnects a Google account (cascade) |

### Invitations

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/invite/[code]` | Join a group by invite code |

### Bob (Voice Assistant)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/bob/transcribe` | Upload audio → Whisper → text |
| POST | `/api/bob/parse` | Text → Claude → event JSON |
| POST | `/api/bob/create` | Creates the validated event |

---

## 17. Pages & Navigation

### Public Pages

| Route | Description |
|-------|-------------|
| `/login` | Login (magic link + Google OAuth) |
| `/invite/[code]` | Join a group via invitation link |

### Authenticated Pages (`/[locale]/(authenticated)/...`)

| Route | Description |
|-------|-------------|
| `/dashboard` | Home — group list + upcoming events |
| `/profile` | User settings + Google accounts |
| `/groups/new` | Create a new group |
| `/groups/[id]` | Group detail — members, events, invitations, admin controls |
| `/calendar` | Personal calendar (across all groups) |
| `/google-sync` | Google sync page (suggestions, accept/refuse) |
| `/bob` | Voice assistant for creating events |

### Navigation

- **TopBar**: logo, theme toggle (heart), language selector
- **BottomNav** (4 tabs): Dashboard, Calendar, Google Sync, Bob
- Locale routing: `/fr/...` or `/en/...`

---

## 18. Security (RLS)

### Policies by Table

#### profiles
- **SELECT**: all authenticated users
- **INSERT**: own profile only
- **UPDATE**: own profile only

#### groups
- **SELECT**: creators + group members
- **INSERT**: any authenticated user (with `created_by = auth.uid()`)
- **UPDATE**: group admins only
- **DELETE**: group admins only

#### group_members
- **SELECT**: group co-members (via `is_group_member()`)
- **INSERT**: if creator (`is_group_creator()`) or invited (`has_pending_invitation()`)
- **UPDATE**: admins (role/color) + members (own color)
- **DELETE**: admins (any member) + members (themselves)

#### event_types
- **SELECT**: all authenticated users
- **INSERT/UPDATE/DELETE**: own types only (not system types)

#### events
- **SELECT**: owner + co-members from shared groups
- **INSERT/UPDATE/DELETE**: owner only

#### invitations
- **SELECT**: group members
- **INSERT**: group admins
- **UPDATE**: invited user (accept)
- **DELETE**: group admins

#### google_accounts / google_calendars / google_synced_events
- **All operations**: account owner only (via SECURITY DEFINER functions)

### Critical Patterns

1. **INSERT + SELECT combo**: `.insert().select()` requires the row to pass both policies
2. **Cross-table recursion**: SECURITY DEFINER functions break the cycles
3. **Self-referencing policies**: `group_members` uses `is_group_member()` instead of a direct subquery
4. **Silent joins**: Supabase returns `null` (no error) if RLS blocks a joined table

---

## 19. Tests

### Configuration

- **Framework**: Vitest 4 + Testing Library (React) + jsdom
- **Files**: 24 test files in `src/__tests__/`
- **Total**: 219+ passing tests

### Coverage

| Feature | Tests | Status |
|---------|-------|--------|
| Auth | Yes | Covered |
| Profile | Yes | Covered |
| Groups | Yes | Covered |
| Invitations | Yes | Covered |
| Events (CRUD) | Yes | Covered |
| Calendar | Yes | Covered |
| Google Sync (M9) | No | No unit tests |
| Photo Upload (M10) | No | No unit tests |
| Bob | Yes | Covered |

### Commands

```bash
npx vitest          # Watch mode
npx vitest run      # Single run
```

---

## 20. Deployment

### Vercel

- **Preview**: automatic deployments on every branch
- **Production**: deployment on merge to `main`
- **Framework preset**: Next.js

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `OPENAI_API_KEY` | OpenAI API key (Whisper) |
| `ANTHROPIC_API_KEY` | Anthropic API key (Claude) |

---

## Milestone History

| Milestone | Description | Status |
|-----------|-------------|--------|
| M1 | Foundations & Auth (magic link + Google OAuth) | Done |
| M2 | Rich group pages | Done |
| M3 | Invitation system | Done |
| M4 | Event CRUD | Done |
| M5–M7 | Calendars & filters | Done |
| M8 | Polish & PWA | Done |
| M9a | Google Calendar — multi-account connection | Done |
| M9b | Google Calendar — calendar selection + sync | Done |
| M9c | Google Calendar — suggestions page | Done |
| M9d | Google Calendar — auto-sync + "G" badge | Done |
| M10 | Photo uploads (avatar + group) | Done |
