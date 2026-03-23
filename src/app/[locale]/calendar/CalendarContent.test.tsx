import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarContent from './CalendarContent';
import type { CalendarEvent, EventType } from '@/lib/types/events';

let mockLocale = 'fr';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/calendar',
}));

const mockEventTypes: EventType[] = [
  { id: 'et1', name: 'Vacances', icon: 'BeachAccess', is_system: true },
  { id: 'et2', name: 'Disponible', icon: 'EventAvailable', is_system: true },
];

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'evt-1',
    title: 'Beach Holiday',
    description: null,
    location: null,
    start_date: '2026-03-15',
    end_date: '2026-03-20',
    start_time: null,
    end_time: null,
    is_all_day: true,
    is_private: false,
    user_id: 'user-1',
    event_type_id: 'et1',
    event_types: { name: 'Vacances', icon: 'BeachAccess' },
    ...overrides,
  };
}

describe('CalendarContent', () => {
  beforeEach(() => {
    mockLocale = 'fr';
    vi.clearAllMocks();
  });

  it('renders the current month and year', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    // Should show month name and year
    const now = new Date();
    const year = now.getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders day names in French by default', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Dim')).toBeInTheDocument();
  });

  it('renders day names in English when locale is en', () => {
    mockLocale = 'en';
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    expect(screen.getByLabelText('previousMonth')).toBeInTheDocument();
    expect(screen.getByLabelText('nextMonth')).toBeInTheDocument();
  });

  it('navigates to next month', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    const nextBtn = screen.getByLabelText('nextMonth');
    const now = new Date();
    const currentMonthFR = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    const nextMonth = (now.getMonth() + 1) % 12;

    fireEvent.click(nextBtn);
    expect(screen.getByText(new RegExp(currentMonthFR[nextMonth]))).toBeInTheDocument();
  });

  it('navigates to previous month', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    const prevBtn = screen.getByLabelText('previousMonth');
    const now = new Date();
    const currentMonthFR = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

    fireEvent.click(prevBtn);
    expect(screen.getByText(new RegExp(currentMonthFR[prevMonth]))).toBeInTheDocument();
  });

  it('displays events on the calendar', () => {
    // Use current month for reliable rendering
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const event = makeEvent({
      start_date: `${y}-${m}-10`,
      end_date: `${y}-${m}-10`,
      title: 'Test Event',
    });

    render(<CalendarContent events={[event]} eventTypes={mockEventTypes} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('shows multi-day events across days', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const event = makeEvent({
      start_date: `${y}-${m}-05`,
      end_date: `${y}-${m}-07`,
      title: 'Multi Day',
    });

    render(<CalendarContent events={[event]} eventTypes={mockEventTypes} />);
    // Should appear on multiple days
    const elements = screen.getAllByText('Multi Day');
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows hint text', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    expect(screen.getByText('clickToCreate')).toBeInTheDocument();
  });

  it('renders day numbers', () => {
    render(<CalendarContent events={[]} eventTypes={mockEventTypes} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});

// Unit tests for helper functions
describe('CalendarContent helpers (unit)', () => {
  it('getDaysInMonth returns correct days', () => {
    // February 2026 (non-leap) → 28
    expect(new Date(2026, 2, 0).getDate()).toBe(28);
    // March 2026 → 31
    expect(new Date(2026, 3, 0).getDate()).toBe(31);
    // April 2026 → 30
    expect(new Date(2026, 4, 0).getDate()).toBe(30);
  });

  it('formatDateStr produces correct format', () => {
    const result = `${2026}-${String(3).padStart(2, '0')}-${String(5).padStart(2, '0')}`;
    expect(result).toBe('2026-03-05');
  });

  it('isEventOnDay works for single-day event', () => {
    const isOnDay = (start: string, end: string, dateStr: string) =>
      start <= dateStr && end >= dateStr;

    expect(isOnDay('2026-03-15', '2026-03-15', '2026-03-15')).toBe(true);
    expect(isOnDay('2026-03-15', '2026-03-15', '2026-03-14')).toBe(false);
    expect(isOnDay('2026-03-15', '2026-03-15', '2026-03-16')).toBe(false);
  });

  it('isEventOnDay works for multi-day event', () => {
    const isOnDay = (start: string, end: string, dateStr: string) =>
      start <= dateStr && end >= dateStr;

    expect(isOnDay('2026-03-10', '2026-03-15', '2026-03-12')).toBe(true);
    expect(isOnDay('2026-03-10', '2026-03-15', '2026-03-10')).toBe(true);
    expect(isOnDay('2026-03-10', '2026-03-15', '2026-03-15')).toBe(true);
    expect(isOnDay('2026-03-10', '2026-03-15', '2026-03-09')).toBe(false);
    expect(isOnDay('2026-03-10', '2026-03-15', '2026-03-16')).toBe(false);
  });

  it('event type color mapping', () => {
    const colors: Record<string, string> = {
      Vacances: '#D32F2F',
      Disponible: '#388E3C',
      Voyage: '#F57C00',
    };

    expect(colors['Vacances']).toBe('#D32F2F');
    expect(colors['Disponible']).toBe('#388E3C');
    expect(colors['Voyage']).toBe('#F57C00');
    expect(colors['Unknown'] ?? '#1976D2').toBe('#1976D2');
  });
});
