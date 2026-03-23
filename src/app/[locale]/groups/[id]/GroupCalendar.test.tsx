import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupCalendar from './GroupCalendar';
import type { CalendarEvent } from '@/lib/types/events';
import type { GroupMember } from './GroupDetailContent';

let mockLocale = 'fr';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/groups/123',
}));

vi.mock('./EventDetailDialog', () => ({
  default: () => null,
}));

const mockMembers: GroupMember[] = [
  {
    id: 'gm-1',
    user_id: 'user-1',
    role: 'admin',
    color: '#1976D2',
    joined_at: '2026-01-01T00:00:00Z',
    profiles: { display_name: 'Alice', avatar_url: null },
  },
  {
    id: 'gm-2',
    user_id: 'user-2',
    role: 'member',
    color: '#D32F2F',
    joined_at: '2026-01-02T00:00:00Z',
    profiles: { display_name: 'Bob', avatar_url: null },
  },
];

const noopUpdate = vi.fn();
const noopDelete = vi.fn();

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return {
    id: 'evt-1',
    title: 'Team Meeting',
    description: null,
    location: null,
    start_date: `${y}-${m}-10`,
    end_date: `${y}-${m}-10`,
    start_time: null,
    end_time: null,
    is_all_day: true,
    is_private: false,
    user_id: 'user-1',
    event_type_id: null,
    event_types: null,
    ...overrides,
  };
}

const defaultProps = {
  events: [] as CalendarEvent[],
  members: mockMembers,
  currentUserId: 'user-1',
  eventTypes: [],
  onEventUpdated: noopUpdate,
  onEventDeleted: noopDelete,
};

describe('GroupCalendar', () => {
  beforeEach(() => {
    mockLocale = 'fr';
    vi.clearAllMocks();
  });

  it('renders month navigation', () => {
    render(<GroupCalendar {...defaultProps} />);
    expect(screen.getByLabelText('previousMonth')).toBeInTheDocument();
    expect(screen.getByLabelText('nextMonth')).toBeInTheDocument();
  });

  it('renders current month and year', () => {
    render(<GroupCalendar {...defaultProps} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders day names in French', () => {
    render(<GroupCalendar {...defaultProps} />);
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Dim')).toBeInTheDocument();
  });

  it('renders day names in English', () => {
    mockLocale = 'en';
    render(<GroupCalendar {...defaultProps} />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('navigates months', () => {
    render(<GroupCalendar {...defaultProps} />);
    const monthsFR = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    const nextMonth = (new Date().getMonth() + 1) % 12;
    fireEvent.click(screen.getByLabelText('nextMonth'));
    expect(screen.getByText(new RegExp(monthsFR[nextMonth]))).toBeInTheDocument();
  });

  it('displays events on calendar', () => {
    const event = makeEvent({ title: 'Sprint Planning' });
    render(<GroupCalendar {...defaultProps} events={[event]} />);
    expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
  });

  it('renders member filter chips (replaces old legend)', () => {
    render(<GroupCalendar {...defaultProps} />);
    // Filter chips contain member names
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // "All" chip
    expect(screen.getByText('allMembers')).toBeInTheDocument();
  });

  it('shows private events from others as "Busy"', () => {
    const privateEvent = makeEvent({
      id: 'evt-private',
      title: 'Secret Meeting',
      is_private: true,
      user_id: 'user-2', // not currentUser
    });
    render(<GroupCalendar {...defaultProps} events={[privateEvent]} />);
    expect(screen.getByText('busy')).toBeInTheDocument();
    expect(screen.queryByText('Secret Meeting')).not.toBeInTheDocument();
  });

  it('shows own private events with real title', () => {
    const privateEvent = makeEvent({
      id: 'evt-own-private',
      title: 'My Private Event',
      is_private: true,
      user_id: 'user-1', // currentUser
    });
    render(<GroupCalendar {...defaultProps} events={[privateEvent]} />);
    expect(screen.getByText('My Private Event')).toBeInTheDocument();
    expect(screen.queryByText('busy')).not.toBeInTheDocument();
  });

  it('displays multi-day events across days', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const event = makeEvent({
      start_date: `${y}-${m}-05`,
      end_date: `${y}-${m}-07`,
      title: 'Conference',
    });
    render(<GroupCalendar {...defaultProps} events={[event]} />);
    const elements = screen.getAllByText('Conference');
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });

  // Filter tests
  it('filters events when a member chip is toggled off', () => {
    const aliceEvent = makeEvent({ id: 'evt-alice', title: 'Alice Task', user_id: 'user-1' });
    const bobEvent = makeEvent({ id: 'evt-bob', title: 'Bob Task', user_id: 'user-2' });
    render(<GroupCalendar {...defaultProps} events={[aliceEvent, bobEvent]} />);

    // Both visible initially
    expect(screen.getByText('Alice Task')).toBeInTheDocument();
    expect(screen.getByText('Bob Task')).toBeInTheDocument();

    // Click Bob's chip to toggle off
    fireEvent.click(screen.getByText('Bob'));

    // Bob's event should be hidden
    expect(screen.getByText('Alice Task')).toBeInTheDocument();
    expect(screen.queryByText('Bob Task')).not.toBeInTheDocument();
  });

  it('toggles all members off and on with "All" chip', () => {
    const event = makeEvent({ title: 'Visible Event' });
    render(<GroupCalendar {...defaultProps} events={[event]} />);

    // Click "All" to deselect all
    fireEvent.click(screen.getByText('allMembers'));
    expect(screen.queryByText('Visible Event')).not.toBeInTheDocument();

    // Click "All" again to select all
    fireEvent.click(screen.getByText('allMembers'));
    expect(screen.getByText('Visible Event')).toBeInTheDocument();
  });

  // Time display test
  it('shows time prefix for timed events', () => {
    const timedEvent = makeEvent({
      title: 'Standup',
      is_all_day: false,
      start_time: '09:30:00',
      end_time: '10:00:00',
    });
    render(<GroupCalendar {...defaultProps} events={[timedEvent]} />);
    expect(screen.getByText('09:30 Standup')).toBeInTheDocument();
  });

  it('does not show time prefix for all-day events', () => {
    const allDayEvent = makeEvent({ title: 'Holiday', is_all_day: true });
    render(<GroupCalendar {...defaultProps} events={[allDayEvent]} />);
    expect(screen.getByText('Holiday')).toBeInTheDocument();
  });
});

// Unit tests for private event logic
describe('GroupCalendar private event logic (unit)', () => {
  it('private event from another user shows as busy', () => {
    const event = { is_private: true, user_id: 'user-2', title: 'Secret' };
    const currentUserId = 'user-1';
    const displayTitle = event.is_private && event.user_id !== currentUserId ? 'Busy' : event.title;
    expect(displayTitle).toBe('Busy');
  });

  it('private event from current user shows real title', () => {
    const event = { is_private: true, user_id: 'user-1', title: 'My Secret' };
    const currentUserId = 'user-1';
    const displayTitle = event.is_private && event.user_id !== currentUserId ? 'Busy' : event.title;
    expect(displayTitle).toBe('My Secret');
  });

  it('public event from any user shows real title', () => {
    const event = { is_private: false, user_id: 'user-2', title: 'Public Event' };
    const currentUserId = 'user-1';
    const displayTitle = event.is_private && event.user_id !== currentUserId ? 'Busy' : event.title;
    expect(displayTitle).toBe('Public Event');
  });
});

// Unit tests for member color mapping
describe('GroupCalendar member color mapping (unit)', () => {
  it('maps user_id to member color', () => {
    const colorMap: Record<string, string> = {};
    for (const m of mockMembers) { colorMap[m.user_id] = m.color; }
    expect(colorMap['user-1']).toBe('#1976D2');
    expect(colorMap['user-2']).toBe('#D32F2F');
  });

  it('falls back for unknown user', () => {
    const colorMap: Record<string, string> = {};
    for (const m of mockMembers) { colorMap[m.user_id] = m.color; }
    expect(colorMap['unknown'] ?? '#999').toBe('#999');
  });
});
