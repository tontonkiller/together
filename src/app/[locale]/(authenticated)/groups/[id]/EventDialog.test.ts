import { describe, it, expect } from 'vitest';

// Test EventDialog validation logic as pure functions
// Extracted from the component for testability

function validateEvent(data: {
  title: string;
  startDate: string;
  endDate: string;
}): { valid: boolean; errorKey?: string } {
  if (!data.title.trim()) {
    return { valid: false, errorKey: 'titleRequired' };
  }
  if (!data.startDate || !data.endDate) {
    return { valid: false, errorKey: 'dateRequired' };
  }
  if (data.endDate < data.startDate) {
    return { valid: false, errorKey: 'dateOrderError' };
  }
  return { valid: true };
}

describe('Event validation', () => {
  it('rejects empty title', () => {
    const result = validateEvent({ title: '', startDate: '2025-03-15', endDate: '2025-03-15' });
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe('titleRequired');
  });

  it('rejects whitespace-only title', () => {
    const result = validateEvent({ title: '   ', startDate: '2025-03-15', endDate: '2025-03-15' });
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe('titleRequired');
  });

  it('rejects missing start date', () => {
    const result = validateEvent({ title: 'Vacation', startDate: '', endDate: '2025-03-15' });
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe('dateRequired');
  });

  it('rejects missing end date', () => {
    const result = validateEvent({ title: 'Vacation', startDate: '2025-03-15', endDate: '' });
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe('dateRequired');
  });

  it('rejects end date before start date', () => {
    const result = validateEvent({ title: 'Vacation', startDate: '2025-03-20', endDate: '2025-03-15' });
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe('dateOrderError');
  });

  it('accepts valid event with same start and end date', () => {
    const result = validateEvent({ title: 'Meeting', startDate: '2025-03-15', endDate: '2025-03-15' });
    expect(result.valid).toBe(true);
    expect(result.errorKey).toBeUndefined();
  });

  it('accepts valid event with end date after start date', () => {
    const result = validateEvent({ title: 'Vacation', startDate: '2025-03-15', endDate: '2025-03-20' });
    expect(result.valid).toBe(true);
  });

  it('accepts title with leading/trailing spaces (trimmed check)', () => {
    const result = validateEvent({ title: '  Trip  ', startDate: '2025-03-15', endDate: '2025-03-20' });
    expect(result.valid).toBe(true);
  });
});

describe('Event data preparation', () => {
  it('nullifies times for all-day events', () => {
    const isAllDay = true;
    const startTime = '09:00';
    const endTime = '17:00';

    const eventData = {
      start_time: isAllDay ? null : startTime,
      end_time: isAllDay ? null : endTime,
      is_all_day: isAllDay,
    };

    expect(eventData.start_time).toBeNull();
    expect(eventData.end_time).toBeNull();
    expect(eventData.is_all_day).toBe(true);
  });

  it('includes times for non-all-day events', () => {
    const isAllDay = false;
    const startTime = '09:00';
    const endTime = '17:00';

    const eventData = {
      start_time: isAllDay ? null : startTime,
      end_time: isAllDay ? null : endTime,
      is_all_day: isAllDay,
    };

    expect(eventData.start_time).toBe('09:00');
    expect(eventData.end_time).toBe('17:00');
    expect(eventData.is_all_day).toBe(false);
  });

  it('nullifies empty optional fields', () => {
    const description = '';
    const location = '';
    const eventTypeId = '';

    const eventData = {
      description: description.trim() || null,
      location: location.trim() || null,
      event_type_id: eventTypeId || null,
    };

    expect(eventData.description).toBeNull();
    expect(eventData.location).toBeNull();
    expect(eventData.event_type_id).toBeNull();
  });

  it('preserves non-empty optional fields', () => {
    const description = 'Fun trip';
    const location = 'Paris';
    const eventTypeId = 'type-1';

    const eventData = {
      description: description.trim() || null,
      location: location.trim() || null,
      event_type_id: eventTypeId || null,
    };

    expect(eventData.description).toBe('Fun trip');
    expect(eventData.location).toBe('Paris');
    expect(eventData.event_type_id).toBe('type-1');
  });
});
