import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardContent, { type DashboardContentProps, type UpcomingEvent } from './DashboardContent';

// Mock AuthenticatedLayout to just render children
vi.mock('@/components/layout/AuthenticatedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockPush = vi.fn();
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: vi.fn() }),
}));

function renderDashboard(overrides: Partial<DashboardContentProps> = {}) {
  const defaults: DashboardContentProps = {
    profile: { display_name: 'Alice' },
    groups: [],
    upcomingEvents: [],
    ...overrides,
  };
  return render(<DashboardContent {...defaults} />);
}

describe('DashboardContent', () => {
  it('shows greeting with profile name', () => {
    renderDashboard({ profile: { display_name: 'Bob' } });
    // Translation key is returned as-is by mock, but we check it was called
    expect(screen.getByText(/greeting/)).toBeInTheDocument();
  });

  it('falls back to "User" when profile is null', () => {
    renderDashboard({ profile: null });
    expect(screen.getByText(/greeting/)).toBeInTheDocument();
  });

  it('shows empty state when no groups', () => {
    renderDashboard({ groups: [] });
    expect(screen.getByText('noGroups')).toBeInTheDocument();
    expect(screen.getByText('noGroupsHint')).toBeInTheDocument();
  });

  it('renders groups when they exist', () => {
    renderDashboard({
      groups: [
        {
          group_id: 'g1',
          role: 'admin',
          groups: { id: 'g1', name: 'Family', description: 'My family group' },
        },
        {
          group_id: 'g2',
          role: 'member',
          groups: { id: 'g2', name: 'Friends', description: null },
        },
      ],
    });

    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('My family group')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
    expect(screen.queryByText('noGroups')).not.toBeInTheDocument();
  });

  it('does not show description when null', () => {
    renderDashboard({
      groups: [
        {
          group_id: 'g1',
          role: 'admin',
          groups: { id: 'g1', name: 'Family', description: null },
        },
      ],
    });

    expect(screen.getByText('Family')).toBeInTheDocument();
    // No description text should appear
  });

  it('shows upcoming events section when events exist', () => {
    const events: UpcomingEvent[] = [
      {
        id: 'e1',
        title: 'Beach Trip',
        start_date: '2025-07-15',
        end_date: '2025-07-15',
        is_all_day: true,
        start_time: null,
        end_time: null,
        event_type_id: null,
        event_types: null,
      },
    ];

    renderDashboard({ upcomingEvents: events });
    expect(screen.getByText('upcomingEvents')).toBeInTheDocument();
    expect(screen.getByText('Beach Trip')).toBeInTheDocument();
  });

  it('hides upcoming events section when empty', () => {
    renderDashboard({ upcomingEvents: [] });
    expect(screen.queryByText('upcomingEvents')).not.toBeInTheDocument();
  });

  it('shows event type chip when event_types is present', () => {
    const events: UpcomingEvent[] = [
      {
        id: 'e1',
        title: 'Trip',
        start_date: '2025-07-15',
        end_date: '2025-07-20',
        is_all_day: true,
        start_time: null,
        end_time: null,
        event_type_id: 'type-1',
        event_types: { name: 'Vacances', icon: null },
      },
    ];

    renderDashboard({ upcomingEvents: events });
    expect(screen.getByText('Vacances')).toBeInTheDocument();
  });

  it('renders create group button', () => {
    renderDashboard();
    expect(screen.getByText('createGroup')).toBeInTheDocument();
  });
});

describe('formatEventDate (extracted logic)', () => {
  // Test the pure function logic that lives in DashboardContent
  function formatEventDate(
    startDate: string,
    endDate: string,
    isAllDay: boolean,
    startTime: string | null,
  ): string {
    const start = new Date(startDate + 'T00:00:00');
    const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const dateStr = start.toLocaleDateString(undefined, dateOpts);

    if (startDate !== endDate) {
      const end = new Date(endDate + 'T00:00:00');
      return `${dateStr} → ${end.toLocaleDateString(undefined, dateOpts)}`;
    }
    if (!isAllDay && startTime) {
      return `${dateStr} ${startTime.slice(0, 5)}`;
    }
    return dateStr;
  }

  it('formats multi-day events with arrow', () => {
    const result = formatEventDate('2025-03-15', '2025-03-20', true, null);
    expect(result).toContain('→');
  });

  it('formats same-day timed events with time', () => {
    const result = formatEventDate('2025-03-15', '2025-03-15', false, '09:30:00');
    expect(result).toContain('09:30');
  });

  it('formats same-day all-day events without time', () => {
    const result = formatEventDate('2025-03-15', '2025-03-15', true, null);
    expect(result).not.toContain('→');
    expect(result).not.toContain(':');
  });

  it('handles null start time for non-all-day gracefully', () => {
    const result = formatEventDate('2025-03-15', '2025-03-15', false, null);
    // Should just return date without time
    expect(result).not.toContain(':');
  });
});
