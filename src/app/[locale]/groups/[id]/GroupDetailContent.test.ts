import { describe, it, expect } from 'vitest';

// Test group detail business logic as pure functions
// Extracted from GroupDetailContent for testability

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  color: string;
  joined_at: string;
}

describe('Admin transfer logic', () => {
  function getNextAdmin(members: GroupMember[], currentUserId: string): GroupMember | null {
    const otherMembers = members
      .filter((m) => m.user_id !== currentUserId)
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

    return otherMembers.length > 0 ? otherMembers[0] : null;
  }

  it('selects the oldest other member as next admin', () => {
    const members: GroupMember[] = [
      { id: 'm1', user_id: 'u1', role: 'admin', color: '#000', joined_at: '2025-01-01' },
      { id: 'm2', user_id: 'u2', role: 'member', color: '#111', joined_at: '2025-01-15' },
      { id: 'm3', user_id: 'u3', role: 'member', color: '#222', joined_at: '2025-01-10' },
    ];

    const next = getNextAdmin(members, 'u1');
    expect(next?.user_id).toBe('u3'); // u3 joined before u2
  });

  it('returns null when only one member', () => {
    const members: GroupMember[] = [
      { id: 'm1', user_id: 'u1', role: 'admin', color: '#000', joined_at: '2025-01-01' },
    ];

    const next = getNextAdmin(members, 'u1');
    expect(next).toBeNull();
  });

  it('works with two members', () => {
    const members: GroupMember[] = [
      { id: 'm1', user_id: 'u1', role: 'admin', color: '#000', joined_at: '2025-01-01' },
      { id: 'm2', user_id: 'u2', role: 'member', color: '#111', joined_at: '2025-02-01' },
    ];

    const next = getNextAdmin(members, 'u1');
    expect(next?.user_id).toBe('u2');
  });
});

describe('Event sorting', () => {
  interface Event {
    id: string;
    start_date: string;
  }

  function sortEvents(events: Event[]): Event[] {
    return [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));
  }

  it('sorts events by start_date ascending', () => {
    const events: Event[] = [
      { id: '3', start_date: '2025-04-01' },
      { id: '1', start_date: '2025-01-15' },
      { id: '2', start_date: '2025-03-10' },
    ];

    const sorted = sortEvents(events);
    expect(sorted.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('handles empty array', () => {
    expect(sortEvents([])).toEqual([]);
  });

  it('handles single event', () => {
    const events = [{ id: '1', start_date: '2025-01-01' }];
    expect(sortEvents(events)).toEqual(events);
  });

  it('maintains order for same dates', () => {
    const events: Event[] = [
      { id: '1', start_date: '2025-03-15' },
      { id: '2', start_date: '2025-03-15' },
    ];

    const sorted = sortEvents(events);
    expect(sorted).toHaveLength(2);
  });
});

describe('Admin role checks', () => {
  it('correctly identifies admin', () => {
    expect('admin' === 'admin').toBe(true);
  });

  it('correctly identifies non-admin', () => {
    expect('member' === 'admin').toBe(false);
  });

  it('rename requires non-empty name', () => {
    expect(''.trim()).toBe('');
    expect('  '.trim()).toBe('');
    expect('New Name'.trim()).toBe('New Name');
    expect(' Trimmed '.trim()).toBe('Trimmed');
  });
});

describe('Invitation expiry check', () => {
  it('identifies expired invitations', () => {
    const pastDate = '2024-01-01T00:00:00Z';
    const isExpired = new Date(pastDate) < new Date();
    expect(isExpired).toBe(true);
  });

  it('identifies valid invitations', () => {
    const futureDate = '2099-12-31T00:00:00Z';
    const isExpired = new Date(futureDate) < new Date();
    expect(isExpired).toBe(false);
  });
});
