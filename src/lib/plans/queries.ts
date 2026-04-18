import type { PlanWithSlots } from '@/lib/types/plans';
import { hasUserVotedOnAnySlot } from './resolveHelpers';

export interface PlanBadgeInfo {
  /** group_id → number of open plans where user hasn't voted yet */
  pendingByGroup: Record<string, number>;
}

/**
 * Counts plans needing the user's vote, keyed by group_id.
 * Only `status === 'open'` plans count.
 * Also counts `pending_tiebreak` plans where user is the creator.
 */
export function computePlanBadges(
  plans: PlanWithSlots[],
  userId: string,
): PlanBadgeInfo {
  const pendingByGroup: Record<string, number> = {};

  for (const plan of plans) {
    if (plan.status === 'open' && !hasUserVotedOnAnySlot(plan, userId)) {
      pendingByGroup[plan.group_id] = (pendingByGroup[plan.group_id] ?? 0) + 1;
    } else if (plan.status === 'pending_tiebreak' && plan.created_by === userId) {
      pendingByGroup[plan.group_id] = (pendingByGroup[plan.group_id] ?? 0) + 1;
    }
  }

  return { pendingByGroup };
}
