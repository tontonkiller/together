import { describe, it, expect } from 'vitest';
import {
  countYesVotes,
  findWinningSlot,
  hasQuorumOnSlot,
  findQuorumSlot,
  hasUserVoted,
  hasUserVotedOnAnySlot,
  daysUntilExpiry,
  isExpired,
} from './resolveHelpers';
import type { PlanSlotWithVotes, PlanWithSlots } from '@/lib/types/plans';

function makeSlot(id: string, votes: { user_id: string; available: boolean }[]): PlanSlotWithVotes {
  return {
    id,
    plan_id: 'p1',
    start_date: '2026-05-15',
    end_date: '2026-05-15',
    start_time: null,
    end_time: null,
    position: 0,
    created_at: '2026-04-15T00:00:00Z',
    votes: votes.map((v, i) => ({
      id: `v-${id}-${i}`,
      slot_id: id,
      user_id: v.user_id,
      available: v.available,
      created_at: '2026-04-15T00:00:00Z',
    })),
  };
}

function makePlan(slots: PlanSlotWithVotes[], quorum = 2): PlanWithSlots {
  return {
    id: 'p1',
    group_id: 'g1',
    created_by: 'u1',
    title: 'Test',
    description: null,
    quorum,
    status: 'open',
    resolved_slot_id: null,
    event_id: null,
    expires_at: '2026-04-20T00:00:00Z',
    created_at: '2026-04-15T00:00:00Z',
    updated_at: '2026-04-15T00:00:00Z',
    slots,
    creator_profile: null,
  };
}

describe('countYesVotes', () => {
  it('counts only available=true', () => {
    const s = makeSlot('s1', [
      { user_id: 'u1', available: true },
      { user_id: 'u2', available: false },
      { user_id: 'u3', available: true },
    ]);
    expect(countYesVotes(s)).toBe(2);
  });
});

describe('findWinningSlot', () => {
  it('returns none when no votes', () => {
    const slots = [makeSlot('s1', []), makeSlot('s2', [])];
    expect(findWinningSlot(slots)).toEqual({ kind: 'none' });
  });

  it('returns none when all votes are unavailable', () => {
    const slots = [
      makeSlot('s1', [{ user_id: 'u1', available: false }]),
      makeSlot('s2', [{ user_id: 'u2', available: false }]),
    ];
    expect(findWinningSlot(slots)).toEqual({ kind: 'none' });
  });

  it('returns winner when single max', () => {
    const slots = [
      makeSlot('s1', [
        { user_id: 'u1', available: true },
        { user_id: 'u2', available: true },
      ]),
      makeSlot('s2', [{ user_id: 'u3', available: true }]),
    ];
    expect(findWinningSlot(slots)).toEqual({
      kind: 'winner',
      slot_id: 's1',
      yes_count: 2,
    });
  });

  it('returns tie when max is shared', () => {
    const slots = [
      makeSlot('s1', [{ user_id: 'u1', available: true }]),
      makeSlot('s2', [{ user_id: 'u2', available: true }]),
    ];
    const result = findWinningSlot(slots);
    expect(result.kind).toBe('tie');
    if (result.kind === 'tie') {
      expect(result.slot_ids.sort()).toEqual(['s1', 's2']);
      expect(result.yes_count).toBe(1);
    }
  });
});

describe('hasQuorumOnSlot', () => {
  it('true when yes_count >= quorum', () => {
    const s = makeSlot('s1', [
      { user_id: 'u1', available: true },
      { user_id: 'u2', available: true },
    ]);
    expect(hasQuorumOnSlot(s, 2)).toBe(true);
    expect(hasQuorumOnSlot(s, 3)).toBe(false);
  });
});

describe('findQuorumSlot', () => {
  it('finds first slot reaching quorum', () => {
    const plan = makePlan(
      [
        makeSlot('s1', [{ user_id: 'u1', available: true }]),
        makeSlot('s2', [
          { user_id: 'u1', available: true },
          { user_id: 'u2', available: true },
        ]),
      ],
      2,
    );
    expect(findQuorumSlot(plan)).toBe('s2');
  });

  it('returns null when no slot has quorum', () => {
    const plan = makePlan(
      [makeSlot('s1', [{ user_id: 'u1', available: true }])],
      2,
    );
    expect(findQuorumSlot(plan)).toBeNull();
  });
});

describe('hasUserVoted / hasUserVotedOnAnySlot', () => {
  it('detects user presence in votes array', () => {
    const s = makeSlot('s1', [{ user_id: 'u1', available: true }]);
    expect(hasUserVoted(s, 'u1')).toBe(true);
    expect(hasUserVoted(s, 'u2')).toBe(false);
  });

  it('true when user voted on any slot (even unavailable)', () => {
    const plan = makePlan([
      makeSlot('s1', []),
      makeSlot('s2', [{ user_id: 'u1', available: false }]),
    ]);
    expect(hasUserVotedOnAnySlot(plan, 'u1')).toBe(true);
    expect(hasUserVotedOnAnySlot(plan, 'u2')).toBe(false);
  });
});

describe('daysUntilExpiry / isExpired', () => {
  const now = new Date('2026-04-15T12:00:00Z');

  it('daysUntilExpiry ceils partial days', () => {
    expect(daysUntilExpiry('2026-04-18T12:00:00Z', now)).toBe(3);
    expect(daysUntilExpiry('2026-04-15T13:00:00Z', now)).toBe(1);
  });

  it('daysUntilExpiry returns 0 when past', () => {
    expect(daysUntilExpiry('2026-04-10T00:00:00Z', now)).toBe(0);
  });

  it('isExpired true when expiry <= now', () => {
    expect(isExpired('2026-04-14T12:00:00Z', now)).toBe(true);
    expect(isExpired('2026-04-16T12:00:00Z', now)).toBe(false);
  });
});
