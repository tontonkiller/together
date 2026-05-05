/**
 * Performance regression tests.
 *
 * These guard the wins from the navigation-speed optimization:
 *   1. BottomNav must prefetch every tab on mount (so taps feel instant).
 *   2. DashboardContent must hydrate within a budget even with many groups/events.
 *   3. AutoSync must NOT issue its fetch synchronously on mount — it has to
 *      be deferred (idle/timeout) so it can't block hydration of the new page.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// --- Mocks shared across all tests in this file ---

const mockPrefetch = vi.fn();
const mockPush = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: mockPrefetch,
  }),
  usePathname: () => mockPathname,
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & React.ComponentProps<'a'>) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a>
  ),
}));

// EventDialog is heavy (forms, dialogs) — stub it so we measure layout only.
vi.mock('@/app/[locale]/(authenticated)/groups/[id]/EventDialog', () => ({
  default: () => null,
}));

import BottomNav from '@/components/layout/BottomNav';
import DashboardContent, {
  type DashboardContentProps,
  type UpcomingEvent,
} from '@/app/[locale]/(authenticated)/dashboard/DashboardContent';
import AutoSync from '@/components/google/AutoSync';

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname = '/dashboard';
});

describe('BottomNav prefetching', () => {
  it('prefetches every nav tab on mount', () => {
    render(<BottomNav />);
    const calls = mockPrefetch.mock.calls.map((c) => c[0]);
    expect(calls).toEqual(
      expect.arrayContaining(['/dashboard', '/calendar', '/google-sync', '/bob', '/profile']),
    );
    expect(calls.length).toBeGreaterThanOrEqual(5);
  });
});

describe('DashboardContent render budget', () => {
  function makeEvent(i: number): UpcomingEvent {
    return {
      id: `e${i}`,
      title: `Event ${i}`,
      description: null,
      location: null,
      start_date: '2026-06-01',
      end_date: '2026-06-01',
      is_all_day: true,
      is_private: false,
      start_time: null,
      end_time: null,
      user_id: 'u1',
      event_type_id: null,
      event_types: null,
    };
  }

  function renderLargeDashboard() {
    const props: DashboardContentProps = {
      profile: { display_name: 'Alice' },
      groups: Array.from({ length: 50 }, (_, i) => ({
        group_id: `g${i}`,
        role: 'member',
        groups: { id: `g${i}`, name: `Group ${i}`, description: null, avatar_url: null },
      })),
      upcomingEvents: Array.from({ length: 50 }, (_, i) => makeEvent(i)),
      eventTypes: [],
      planBadges: {},
    };
    return render(<DashboardContent {...props} />);
  }

  it('renders 50 groups + 50 events under 1500ms', () => {
    const start = performance.now();
    const { unmount } = renderLargeDashboard();
    const elapsed = performance.now() - start;
    unmount();
    // Budget is generous because jsdom + MUI are slower than a real browser.
    // The test exists to catch *regressions* (e.g. an O(n^2) loop creeping in),
    // not to assert real-world wall-clock numbers.
    expect(elapsed).toBeLessThan(1500);
  });

  it('renders an empty dashboard under 200ms', () => {
    const start = performance.now();
    const { unmount } = render(
      <DashboardContent
        profile={{ display_name: 'Alice' }}
        groups={[]}
        upcomingEvents={[]}
        eventTypes={[]}
      />,
    );
    const elapsed = performance.now() - start;
    unmount();
    expect(elapsed).toBeLessThan(200);
  });
});

describe('AutoSync defers its fetch', () => {
  it('does not call fetch synchronously on mount', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    // Force the timer fallback path so we don't depend on requestIdleCallback.
    const originalRic = (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
    (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = undefined;

    try {
      render(<AutoSync />);
      // Synchronous assertion: the fetch must not have fired yet.
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = originalRic;
      fetchSpy.mockRestore();
    }
  });
});
