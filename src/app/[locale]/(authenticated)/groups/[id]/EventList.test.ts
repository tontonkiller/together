import { describe, it, expect } from 'vitest';

// Test the formatDateRange logic extracted from EventList
// We test the pure logic without React component rendering

function formatDateRange(
  startDate: string,
  endDate: string,
  isAllDay: boolean,
  startTime: string | null,
  endTime: string | null,
  allDayLabel: string,
): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const sameDay = startDate === endDate;

  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

  if (sameDay) {
    const dateStr = start.toLocaleDateString(undefined, dateOpts);
    if (isAllDay) return `${dateStr} — ${allDayLabel}`;
    return `${dateStr} ${startTime?.slice(0, 5) ?? ''} - ${endTime?.slice(0, 5) ?? ''}`;
  }

  const startStr = start.toLocaleDateString(undefined, dateOpts);
  const endStr = end.toLocaleDateString(undefined, dateOpts);
  return `${startStr} → ${endStr}`;
}

describe('formatDateRange', () => {
  it('formats same-day all-day events', () => {
    const result = formatDateRange('2025-03-15', '2025-03-15', true, null, null, 'All day');
    expect(result).toContain('—');
    expect(result).toContain('All day');
  });

  it('formats same-day timed events with start and end times', () => {
    const result = formatDateRange('2025-03-15', '2025-03-15', false, '09:00:00', '17:00:00', 'All day');
    expect(result).toContain('09:00');
    expect(result).toContain('17:00');
    expect(result).not.toContain('All day');
  });

  it('formats multi-day events with arrow separator', () => {
    const result = formatDateRange('2025-03-15', '2025-03-20', true, null, null, 'All day');
    expect(result).toContain('→');
    expect(result).not.toContain('All day');
  });

  it('handles missing start time gracefully', () => {
    const result = formatDateRange('2025-03-15', '2025-03-15', false, null, '17:00:00', 'All day');
    expect(result).toContain(' - ');
  });

  it('handles missing end time gracefully', () => {
    const result = formatDateRange('2025-03-15', '2025-03-15', false, '09:00:00', null, 'All day');
    expect(result).toContain('09:00');
  });

  it('slices time to 5 chars (HH:MM)', () => {
    const result = formatDateRange('2025-03-15', '2025-03-15', false, '09:30:00', '17:45:00', 'All day');
    expect(result).toContain('09:30');
    expect(result).toContain('17:45');
    expect(result).not.toContain(':00');
  });
});
