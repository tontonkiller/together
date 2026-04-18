import { describe, it, expect } from 'vitest';
import { computePlanBadges } from './queries';
import type { PlanWithSlots, PlanStatus } from '@/lib/types/plans';

function makePlan(
  id: string,
  groupId: string,
  status: PlanStatus,
  createdBy: string,
  voters: string[],
): PlanWithSlots {
  return {
    id,
    group_id: groupId,
    created_by: createdBy,
    title: id,
    description: null,
    quorum: 2,
    status,
    resolved_slot_id: null,
    event_id: null,
    expires_at: '2026-04-25T00:00:00Z',
    created_at: '2026-04-15T00:00:00Z',
    updated_at: '2026-04-15T00:00:00Z',
    creator_profile: null,
    slots: [
      {
        id: `${id}-s1`,
        plan_id: id,
        start_date: '2026-05-01',
        end_date: '2026-05-01',
        start_time: null,
        end_time: null,
        position: 0,
        created_at: '2026-04-15T00:00:00Z',
        votes: voters.map((u, i) => ({
          id: `${id}-v${i}`,
          slot_id: `${id}-s1`,
          user_id: u,
          available: true,
          created_at: '2026-04-15T00:00:00Z',
        })),
      },
    ],
  };
}

describe('computePlanBadges', () => {
  it('counts open plans where user has not voted', () => {
    const plans = [
      makePlan('p1', 'g1', 'open', 'u2', []),           // user u1 hasn't voted → count
      makePlan('p2', 'g1', 'open', 'u2', ['u1']),        // user u1 voted → skip
      makePlan('p3', 'g2', 'open', 'u2', []),           // different group → count
    ];
    const result = computePlanBadges(plans, 'u1');
    expect(result.pendingByGroup).toEqual({ g1: 1, g2: 1 });
  });

  it('counts pending_tiebreak plans where user is creator', () => {
    const plans = [
      makePlan('p1', 'g1', 'pending_tiebreak', 'u1', []), // creator → count
      makePlan('p2', 'g1', 'pending_tiebreak', 'u2', []), // not creator → skip
    ];
    const result = computePlanBadges(plans, 'u1');
    expect(result.pendingByGroup).toEqual({ g1: 1 });
  });

  it('ignores resolved / expired plans', () => {
    const plans = [
      makePlan('p1', 'g1', 'resolved', 'u2', []),
      makePlan('p2', 'g1', 'expired', 'u2', []),
    ];
    const result = computePlanBadges(plans, 'u1');
    expect(result.pendingByGroup).toEqual({});
  });

  it('returns empty when no plans', () => {
    expect(computePlanBadges([], 'u1').pendingByGroup).toEqual({});
  });
});
