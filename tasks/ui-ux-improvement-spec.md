# UI/UX Improvement Spec — Together App

> **Goal**: Improve visual quality, consistency, accessibility, and UX polish **without changing any features**.
> **Agents**: UI Designer + UX Architect joint audit
> **Date**: 2026-03-23

---

## Executive Summary

Both agents explored the full codebase independently. The app has solid functionality but accumulated visual/UX debt across 18 areas. This spec organizes fixes into 4 tiers by impact and groups related changes into implementable milestones.

---

## Tier 1 — Critical (Accessibility & Correctness)

### 1.1 — Fix WCAG contrast failures on member color event pills

**Problem**: White text on `#AFB42B` (lime) = 2.1:1 contrast ratio. `#F57C00` (orange) = 3.1:1. Both fail WCAG AA (4.5:1 minimum).
**Files**: `src/lib/utils/colors.ts`, `CalendarContent.tsx`, `GroupCalendar.tsx`
**Fix**: Add a `getContrastTextColor(bgHex): '#fff' | '#000'` utility that returns black or white based on relative luminance. Apply it everywhere member colors are used with text overlay.

**Tests**:
- `colors.test.ts`: Add test cases for `getContrastTextColor` — verify lime/orange return `#000`, dark colors return `#fff`
- `CalendarContent.test.tsx`: Verify event pills render with correct text color for light backgrounds
- `GroupCalendar.test.tsx`: Same verification

---

### 1.2 — Add missing accessibility to GroupCalendar

**Problem**: GroupCalendar day cells have no `aria-label` (CalendarContent has them). Event pills have no `focus-visible` outline (CalendarContent has them).
**Files**: `src/app/[locale]/groups/[id]/GroupCalendar.tsx`
**Fix**:
- Add `aria-label` to day cells (e.g. "March 23, 3 events")
- Add `'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 }` to event pills
- Add `alt` attribute to member `Avatar` components

**Tests**:
- `GroupCalendar.test.tsx`: Assert day cells have `aria-label` matching date + event count
- `GroupCalendar.test.tsx`: Assert event pills have `role="button"` and `tabIndex={0}` (already exist, add assertion for focus-visible style)

---

### 1.3 — Fix hardcoded French string in GoogleSyncContent

**Problem**: Line ~93: `` `${data.newPending} nouveau(x), ${data.updated} mis à jour, ${data.deleted} supprimé(s)` `` — not i18n'd.
**Files**: `src/app/[locale]/google-sync/GoogleSyncContent.tsx`, `messages/en.json`, `messages/fr.json`
**Fix**: Add translation key `googleSync.syncResult` with ICU placeholders: `"{newPending} new, {updated} updated, {deleted} deleted"` (EN) / `"{newPending} nouveau(x), {updated} mis à jour, {deleted} supprimé(s)"` (FR).

**Tests**:
- Add `GoogleSyncContent.test.tsx` (new file): Verify sync success message renders via translation key, not hardcoded text

---

### 1.4 — Fix Roboto font not loading

**Problem**: `theme.ts` and `globals.css` reference Roboto, but no `next/font` import exists. Browser falls back to Arial.
**Files**: `src/app/[locale]/layout.tsx` (or a new `src/lib/fonts.ts`)
**Fix**: Use `next/font/google` to load Roboto with weights 400, 500, 600, 700. Apply `className` to `<html>`. Update theme to use the CSS variable.

**Tests**:
- No unit test needed (visual/integration concern). Verify manually that `document.fonts` includes Roboto.

---

## Tier 2 — Significant (Consistency & UX)

### 2.1 — Extract shared CalendarGrid component

**Problem**: `CalendarContent.tsx` and `GroupCalendar.tsx` duplicate ~200 lines of calendar rendering (month navigation, day grid, event pills, today highlight, overflow indicator).
**Files**: New `src/components/calendar/CalendarGrid.tsx`, then refactor both consumers.
**Fix**: Extract shared `CalendarGrid` component with props for:
- `events`, `currentMonth`, `onMonthChange`
- `onDayClick`, `onEventClick`
- `renderEventPill` (render prop for custom pill styling)
- `isMobile` breakpoint flag

**Tests**:
- New `CalendarGrid.test.tsx`: Test month navigation, day rendering, today highlight, event pill rendering, overflow indicator, keyboard navigation, aria-labels
- Update `CalendarContent.test.tsx`: Verify it delegates to CalendarGrid
- Update `GroupCalendar.test.tsx`: Verify it delegates to CalendarGrid

---

### 2.2 — Standardize page layout with shared Container

**Problem**: Inconsistent `maxWidth` across pages — Dashboard/GroupDetail have no constraint (stretches on wide screens), Profile uses `Container sm`, Calendar uses `maxWidth: 600`, GoogleSync uses `Container md`.
**Files**: `src/components/layout/AuthenticatedLayout.tsx`
**Fix**: Add a default `Container maxWidth="md"` wrapper inside `AuthenticatedLayout`'s main content area. Remove per-page Container wrappers. This gives all pages consistent width and removes the double-padding issue on Profile/GoogleSync.

**Tests**:
- Update layout tests to verify Container is rendered
- Verify existing page tests still pass (no visual regression in test assertions)

---

### 2.3 — Standardize Typography hierarchy

**Problem**:
- GoogleSyncContent uses `variant="h5"` for page title (all others use `h2`)
- GroupCalendar uses `variant="h6"` for section title (all others use `h3`)

**Files**: `GoogleSyncContent.tsx`, `GroupCalendar.tsx`
**Fix**: Change GoogleSyncContent title to `variant="h2"`, GroupCalendar section title to `variant="h3"`.

**Tests**:
- `GoogleSyncContent.test.tsx` (from 1.3): Assert page title is an `h2` element
- `GroupCalendar.test.tsx`: Assert section title is an `h3` element

---

### 2.4 — Fix loading skeleton visual mismatch

**Problem**: Loading skeleton cards use default elevated variant, but content cards use `variant="outlined"`. This causes a flash when content loads.
**Files**: `src/app/[locale]/dashboard/loading.tsx`, `src/app/[locale]/groups/[id]/loading.tsx`
**Fix**: Add `variant="outlined"` to skeleton `Card` components to match content cards.

**Tests**:
- `loading.test.tsx` (dashboard): Assert skeleton cards have `variant="outlined"`
- Add `groups/[id]/loading.test.tsx`: Assert skeleton cards have `variant="outlined"`

---

### 2.5 — Improve non-owner event cards in EventList

**Problem**: Non-owner events have `CardActionArea disabled` — they look identical to interactive cards but are inert. No read-only detail view is available from EventList.
**Files**: `src/app/[locale]/groups/[id]/EventList.tsx`
**Fix**: When clicking a non-owner event, open `EventDetailDialog` in read-only mode (same component used in GroupCalendar). Add subtle visual differentiation (slightly reduced opacity or different border style for non-owner cards).

**Tests**:
- `EventList.test.ts`: Assert clicking a non-owner event opens EventDetailDialog
- `EventList.test.ts`: Assert non-owner cards have distinguishing visual cue (e.g. opacity or border style via `data-testid`)

---

### 2.6 — Add consistent empty states

**Problem**:
- Dashboard "Upcoming events" section is hidden when empty (no empty state)
- EventList empty state is plain text only (no icon/illustration)

**Files**: `DashboardContent.tsx`, `EventList.tsx`
**Fix**:
- Dashboard: Always show "Upcoming events" section with empty state card (CalendarIcon + message + hint)
- EventList: Add icon + styled empty state matching groups empty state pattern

**Tests**:
- `DashboardContent.test.tsx`: Assert "Upcoming events" section renders even when events array is empty
- `EventList.test.ts`: Assert empty state renders with icon and message

---

## Tier 3 — Polish (Visual Quality)

### 3.1 — Standardize filter chip selection pattern

**Problem**: Three different patterns for selected chip styling:
- GroupCalendar: custom `sx` with `bgcolor: 'primary.main'`
- CalendarContent: `color={... ? 'primary' : 'default'}`
- GoogleSyncContent: `color={... ? 'primary' : 'default'}`

**Files**: All three components (or extract a `FilterChipGroup` component)
**Fix**: Unify on MUI's `color="primary"` prop for selected state across all filter chips. Remove custom `bgcolor` override.

**Tests**:
- Verify via existing tests that selected chips render with `color="primary"`

---

### 3.2 — Fix button size inconsistencies

**Problem**: Google Sync page uses `size="small"` for the Sync button; EventList uses `size="small"` for Create Event; other similar action buttons use default size.
**Files**: `GoogleSyncContent.tsx`, `EventList.tsx`
**Fix**: Standardize — primary page-level action buttons should be default size. Inline/secondary actions within cards/lists can be `size="small"`.

**Tests**:
- No specific unit tests needed (visual concern)

---

### 3.3 — Fix CircularProgress patterns

**Problem**: Google login button shows spinner as `startIcon` alongside text. Magic link button replaces text with spinner. Inconsistent.
**Files**: `src/app/[locale]/login/LoginContent.tsx` (or equivalent)
**Fix**: Standardize on replacing button text with `CircularProgress size={24}` for all loading buttons.

**Tests**:
- `page.test.tsx` (login): Assert both buttons show `CircularProgress` when loading, without visible label text

---

### 3.4 — Replace emoji icons with MUI Icons in GoogleSyncContent

**Problem**: `📍` emoji used for location and `🔁` for recurrence, while the rest of the app uses MUI Icon components.
**Files**: `GoogleSyncContent.tsx`
**Fix**: Replace `📍` with `<LocationOnIcon fontSize="small" />` and `🔁` with `<RepeatIcon fontSize="small" />`.

**Tests**:
- `GoogleSyncContent.test.tsx`: Assert location renders with an icon element, not emoji text

---

### 3.5 — Fix Eva mode theme-color meta

**Problem**: `<meta name="theme-color">` is hardcoded to `#1976D2`. Doesn't update when Eva mode is toggled.
**Files**: `src/app/[locale]/layout.tsx`, or move to a client-side `useEffect` in `ThemeRegistry`
**Fix**: Make `theme-color` meta tag reactive to the current theme's primary color.

**Tests**:
- `ThemeRegistry` or layout test: Assert meta tag value changes when Eva theme is active

---

### 3.6 — Improve mobile calendar tap targets

**Problem**: Calendar day cells are 32px tall on mobile. Event pills are ~14px. Both below 44px recommended minimum.
**Files**: `CalendarGrid.tsx` (after extraction in 2.1)
**Fix**: Increase mobile cell `minHeight` to 40px. Make event pills at least 24px tall. Consider making the `+N` overflow indicator tappable to show all events for that day.

**Tests**:
- `CalendarGrid.test.tsx`: Assert minimum cell height via style prop
- `CalendarGrid.test.tsx`: Assert `+N` indicator is interactive (has `role="button"`, onClick)

---

### 3.7 — Remove unused secondary color from theme

**Problem**: `secondary: '#FF9800'` / `'#FF69B4'` defined in theme but never used by any component.
**Files**: `src/lib/theme.ts`
**Fix**: Either remove secondary color override (let MUI default apply) or intentionally use it somewhere (e.g. secondary action buttons). Removing is simpler.

**Tests**:
- No test needed

---

## Tier 4 — Nice-to-Have (DX & Minor UX)

### 4.1 — Replace hardcoded layout margins with theme constants

**Problem**: `mt: '64px'` and `mb: '56px'` are magic numbers repeated in AuthenticatedLayout and loading skeletons.
**Files**: `AuthenticatedLayout.tsx`, all `loading.tsx` files
**Fix**: Define constants `TOPBAR_HEIGHT = 64` and `BOTTOMNAV_HEIGHT = 56` in a shared layout config. Use them everywhere.

**Tests**:
- Verify constants are used (grep-level check)

---

### 4.2 — Add InviteDialog close button

**Problem**: InviteDialog has no close button in DialogActions. Users must tap backdrop or press Escape.
**Files**: `src/app/[locale]/groups/[id]/InviteDialog.tsx` (or inline in GroupDetailContent)
**Fix**: Add a "Close" / "Done" button in DialogActions.

**Tests**:
- Assert DialogActions contains a close/done button

---

### 4.3 — Improve EventDetailDialog → EventDialog transition

**Problem**: When clicking "Edit" in EventDetailDialog, the dialog is replaced via conditional render (`if (editOpen) return <EventDialog ...>`). This causes a jarring layout swap.
**Files**: `EventDetailDialog.tsx`
**Fix**: Close EventDetailDialog first, then open EventDialog after a brief delay (or use a shared dialog state manager).

**Tests**:
- `EventDetailDialog.test.ts` (or new): Assert that clicking Edit closes the detail dialog before opening the edit dialog

---

### 4.4 — Standardize event type colors across all views

**Problem**: Event type colors (Vacances=red, Disponible=green, Voyage=orange) only applied in CalendarContent. EventList and GroupCalendar don't color-code event types.
**Files**: Extract to shared constant in `src/lib/utils/eventTypes.ts`, apply in EventList + GroupCalendar
**Fix**: Create shared `EVENT_TYPE_COLORS` map. Use it in Chip components and calendar pills across all views.

**Tests**:
- New `eventTypes.test.ts`: Assert color map contains all system event types
- `EventList.test.ts`: Assert event type chips render with correct color

---

## Implementation Order

| Phase | Items | Effort |
|-------|-------|--------|
| **Phase 1** | 1.1, 1.2, 1.3, 1.4 | Small — focused fixes |
| **Phase 2** | 2.1 (CalendarGrid extraction) | Medium — refactor |
| **Phase 3** | 2.2, 2.3, 2.4, 2.5, 2.6 | Small-Medium — consistency |
| **Phase 4** | 3.1–3.7, 4.1–4.4 | Small — polish |

Each phase should pass all existing tests + new tests before moving to the next.

---

## Test Summary

| Area | New Tests | Updated Tests |
|------|-----------|---------------|
| Color contrast utility | `colors.test.ts` | — |
| CalendarGrid (new) | `CalendarGrid.test.tsx` | — |
| GroupCalendar a11y | — | `GroupCalendar.test.tsx` |
| GoogleSync i18n | `GoogleSyncContent.test.tsx` | — |
| Loading skeletons | `groups/[id]/loading.test.tsx` | `dashboard/loading.test.tsx` |
| EventList non-owner | — | `EventList.test.ts` |
| Dashboard empty states | — | `DashboardContent.test.tsx` |
| CalendarContent refactor | — | `CalendarContent.test.tsx` |
| Typography hierarchy | — | `GroupCalendar.test.tsx` |
| Event type colors | `eventTypes.test.ts` | `EventList.test.ts` |
| Login button loading | — | `login/page.test.tsx` |

**Total**: ~5 new test files, ~8 updated test files
