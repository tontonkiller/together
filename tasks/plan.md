# Plan: M8 — Polish & PWA

## Current State Assessment

### Already done:
- **Manifest**: `src/app/manifest.ts` ✅ (icons 192/512 present)
- **Loading**: `src/app/[locale]/loading.tsx` ✅ (global spinner)
- **Error boundary**: `src/app/[locale]/error.tsx` ✅ (global error page)
- **Empty states**: i18n keys exist for noGroups, noEvents, noMembers ✅
- **Responsive**: `useMediaQuery` used in calendars ✅
- **Build**: Clean, 0 errors ✅

### Missing:
- **No service worker** — needed for PWA installability
- **No `viewport-fit=cover`** — iOS PWA safe area handling
- **No `apple-mobile-web-app-*` meta tags** — iOS install experience
- **Route-level loading/error files** — only at `[locale]` level, not per-route
- **Error boundary is not i18n** — hardcoded English strings
- **No `not-found.tsx`** per locale — 404 handling

## Plan (ordered by impact)

### Step 1: Service Worker + PWA installability
- Create `public/sw.js` — minimal service worker (cache app shell, network-first for API)
- Register SW from layout via a `<ServiceWorkerRegistrar />` client component
- Add `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` meta tags in root layout metadata
- Add `viewport-fit=cover` to viewport metadata
- Add `env(safe-area-inset-*)` padding to TopBar and BottomNav

### Step 2: Route-level loading states
- Add `loading.tsx` for: `dashboard`, `groups/[id]`, `calendar`, `profile`
- Use contextual skeletons (not just a generic spinner)

### Step 3: i18n error boundary + not-found
- Make `error.tsx` use translations (wrap in `useTranslations`)
- Add `not-found.tsx` at `[locale]` level with i18n

### Step 4: Responsive polish
- Audit all pages at 375px width
- Fix any overflow/spacing issues found

### Step 5: Tests & verification
- Run full test suite
- Run build
- Lighthouse audit check (PWA score)
