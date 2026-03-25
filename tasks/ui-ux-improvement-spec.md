# UI/UX Improvement Spec — Together App

> **Goal**: Improve visual quality, consistency, accessibility, and UX polish **without changing any features**.
> **Agents**: UI Designer + UX Architect joint audit
> **Date**: 2026-03-25 (fresh audit, replaces 2026-03-23 version)

---

## Executive Summary

Fresh audit of the full codebase by both agents. Previous audit (March 23) found 21 issues — 8 have been fixed since then. This updated audit found 51 total issues across both agents, organized by severity.

**Score**: 8 DONE / 7 DONE TODAY / 10 TODO / remainder deferred (large refactors or product decisions)

---

## DONE (Previously Fixed)

These items from the March 23 audit are confirmed fixed in the codebase:

| # | Item | Fix Verified |
|---|------|-------------|
| D1 | WCAG contrast (getContrastTextColor) | `colors.ts` + 13 tests |
| D2 | Hardcoded French string in GoogleSync | Uses `t('syncResult', {...})` |
| D3 | Roboto font not loading | `next/font/google` in layout.tsx |
| D4 | Shared Container layout | AuthenticatedLayout `<Container maxWidth="md">` |
| D5 | Typography hierarchy | GoogleSync=h2, GroupCalendar=h3 |
| D6 | Emoji icons → MUI Icons | LocationOnIcon + RepeatIcon |
| D7 | Theme-color meta reactive | ThemeRegistry useEffect |
| D8 | Layout margin constants | TOPBAR_HEIGHT=64, BOTTOMNAV_HEIGHT=64 |

---

## DONE TODAY (March 25 Fixes)

| # | Item | File | Fix |
|---|------|------|-----|
| T1 | Delete event confirmation dialog | EventDialog.tsx | Added confirmDelete state + inline confirm/cancel |
| T2 | Google Sync accept/refuse feedback | GoogleSyncContent.tsx | Added `setSuccessMsg(t('actionSuccess'))` after action |
| T3 | GroupCalendar day cell keyboard a11y | GroupCalendar.tsx | Added `tabIndex={0}` to day cells |
| T4 | TopBar Eva toggle aria-pressed | TopBar.tsx | Added `aria-pressed={evaMode}` |
| T5 | InviteDialog fullScreen mobile | InviteDialog.tsx | Added `useMediaQuery` + `fullScreen={isMobile}` |
| T6 | Dashboard skeleton order | loading.tsx | Swapped to groups-first matching DashboardContent |
| T7 | EventDetailDialog chip fontSize | EventDetailDialog.tsx | Removed hardcoded `fontSize: '0.7rem'`, uses `size="small"` |

---

## Tier 1 — Critical (Accessibility)

### 1.1 — Focus-visible outline contrast on event pills

**Status: TODO**

**Problem**: Event pills use `outlineColor: 'primary.main'` for focus-visible. On light-colored pills (yellow), this outline may not contrast enough.
**Files**: `CalendarContent.tsx`, `GroupCalendar.tsx`
**Fix**: Use `getContrastTextColor()` to pick outline color dynamically, or use a universal high-contrast outline (e.g., dark + white double ring).

---

### 1.2 — Semantic HTML for member toggle section

**Status: TODO**

**Problem**: GroupDetailContent members section uses `role="button"` + `aria-expanded` toggle without wrapping `<fieldset>`/`<legend>`. Screen readers don't associate the list with its toggle.
**Files**: `GroupDetailContent.tsx` lines 315-343
**Fix**: Wrap toggle + list in `<fieldset><legend>` or use proper disclosure pattern.

---

### 1.3 — BottomNav aria-current

**Status: TODO**

**Problem**: No explicit `aria-current="page"` on the active BottomNav item. MUI may handle this internally but needs verification.
**Files**: `BottomNav.tsx`
**Fix**: Verify MUI behavior. If not set automatically, add `aria-current="page"` to selected item.

---

## Tier 2 — Significant (UX Consistency)

### 2.1 — Extract shared CalendarGrid component

**Status: TODO (large refactor — own milestone)**

**Problem**: `CalendarContent.tsx` and `GroupCalendar.tsx` duplicate ~200 lines (month nav, day grid, event pills, today highlight).
**Files**: New `src/components/calendar/CalendarGrid.tsx`
**Fix**: Extract shared component. Also extracts month navigation (audit issue #25).
**Effort**: Medium — needs careful prop design and test migration.

---

### 2.2 — Extract shared date formatting utility

**Status: TODO (large refactor — own milestone)**

**Problem**: `formatEventDate`/`formatDateRange` reimplemented in DashboardContent, EventList, and GoogleSyncContent with different formats.
**Files**: New `src/lib/utils/dates.ts`, then refactor 3 consumers.
**Fix**: One shared function, one consistent format.

---

### 2.3 — Non-owner event cards in EventList

**Status: TODO**

**Problem**: Non-owner events have `CardActionArea disabled` — no tooltip, no read-only view. Users think the UI is broken.
**Files**: `EventList.tsx`
**Fix**: Open EventDetailDialog in read-only mode on click. Add tooltip "Only the creator can edit".

---

### 2.4 — Dashboard empty states lack CTA

**Status: TODO**

**Problem**: "No groups" and "No events" cards are informational but don't guide users to next steps.
**Files**: `DashboardContent.tsx`
**Fix**: Add CTA button inside empty cards (e.g., "Create your first group").

---

### 2.5 — Google Sync page lacks context before connecting

**Status: TODO**

**Problem**: Users with no Google accounts see only a button to go to Profile. No explanation of what sync does.
**Files**: `GoogleSyncContent.tsx`
**Fix**: Add 2-3 sentence description above CTA.

---

### 2.6 — "Accept details" vs "Accept busy" semantics unclear

**Status: TODO**

**Problem**: Users don't understand the difference. No tooltips or explanation.
**Files**: `GoogleSyncContent.tsx`
**Fix**: Add Tooltip to each button explaining what details vs busy means.

---

### 2.7 — Recurring events icon without explanation

**Status: TODO**

**Problem**: RepeatIcon shown but users don't know if accepting imports all instances or one.
**Files**: `GoogleSyncContent.tsx`
**Fix**: Add Tooltip: "Recurring — all instances will be imported".

---

### 2.8 — Calendar "click to create" hint hidden on mobile

**Status: TODO**

**Problem**: Hint `!isMobile` condition hides it on mobile. No affordance cue for mobile users.
**Files**: `CalendarContent.tsx`
**Fix**: Show on mobile too, or use a different pattern (e.g., FAB button).

---

### 2.9 — Leave group warning when last admin

**Status: TODO**

**Problem**: Warning text doesn't clearly explain what happens (oldest member becomes admin).
**Files**: `GroupDetailContent.tsx`
**Fix**: Update warning text to explain the admin transfer.

---

## Tier 3 — Polish

### 3.1 — Eva mode tap highlight color

**Status: TODO**

**Problem**: `globals.css` hardcodes cyan tap highlight. Eva mode users see wrong color.
**Files**: `globals.css`
**Fix**: Move to CSS variable or MUI theme. Non-trivial due to CSS timing.

---

### 3.2 — Alert spacing inconsistency

**Status: TODO**

**Problem**: EventDialog alerts use `mb: 2, mt: 1` while others use `mb: 2`.
**Files**: `EventDialog.tsx` and others
**Fix**: Standardize to `mb: 2` everywhere.

---

### 3.3 — Empty state cards visual hierarchy

**Status: TODO**

**Problem**: Empty state cards look identical to content cards. No visual distinction.
**Files**: `DashboardContent.tsx`, `EventList.tsx`
**Fix**: Add `variant="outlined"` or subtle background to empty cards.

---

### 3.4 — Profile "saved" alert auto-dismiss

**Status: TODO**

**Problem**: "Changes saved" alert stays until user closes it.
**Files**: `ProfileContent.tsx`
**Fix**: Auto-dismiss after 3 seconds via useEffect.

---

### 3.5 — Image upload progress during resize

**Status: TODO**

**Problem**: Image resize (before upload) shows no feedback — button appears frozen 1-2s.
**Files**: `useImageUpload.ts`
**Fix**: Show "Processing..." state during resize phase.

---

### 3.6 — Invite email validation

**Status: TODO**

**Problem**: Email validation only on submit. No inline feedback.
**Files**: `InviteDialog.tsx`
**Fix**: Add onBlur validator with inline error message.

---

### 3.7 — Group delete confirmation context

**Status: TODO**

**Problem**: Delete confirmation says "Are you sure?" with no impact context.
**Files**: `GroupDetailContent.tsx`
**Fix**: Show member count and event count in confirmation.

---

### 3.8 — "Busy" label inconsistency

**Status: TODO**

**Problem**: Private events from others show "Busy" in some views, lock icon in others.
**Files**: `CalendarContent.tsx`, `GroupCalendar.tsx`, `EventDetailDialog.tsx`
**Fix**: Standardize to "Busy" + lock icon everywhere.

---

### 3.9 — AutoSync runs silently

**Status: TODO (product decision needed)**

**Problem**: AutoSync triggers every 5 min with zero feedback. Users don't know if sync is working.
**Files**: `AutoSync.tsx`
**Fix**: Add "Last synced at" indicator or subtle toast. Requires product decision on UX.

---

## Implementation Priority

| Phase | Items | Effort |
|-------|-------|--------|
| **Done** | D1-D8, T1-T7 | Complete |
| **Next** | 1.1-1.3, 2.3-2.9 | Small — individual fixes |
| **Later** | 2.1-2.2 (CalendarGrid + dates) | Medium — refactor milestone |
| **Polish** | 3.1-3.9 | Small — incremental |
