import type { PlanSlotWithVotes, PlanWithSlots } from '@/lib/types/plans';

export interface SlotVoteCount {
  slot_id: string;
  yes_count: number;
}

export type WinnerResult =
  | { kind: 'none' }
  | { kind: 'winner'; slot_id: string; yes_count: number }
  | { kind: 'tie'; slot_ids: string[]; yes_count: number };

export function countYesVotes(slot: PlanSlotWithVotes): number {
  return slot.votes.filter((v) => v.available).length;
}

export function findWinningSlot(slots: PlanSlotWithVotes[]): WinnerResult {
  const counts: SlotVoteCount[] = slots.map((s) => ({
    slot_id: s.id,
    yes_count: countYesVotes(s),
  }));
  const max = counts.reduce((m, c) => (c.yes_count > m ? c.yes_count : m), 0);
  if (max === 0) return { kind: 'none' };
  const winners = counts.filter((c) => c.yes_count === max);
  if (winners.length === 1) {
    return { kind: 'winner', slot_id: winners[0].slot_id, yes_count: max };
  }
  return { kind: 'tie', slot_ids: winners.map((w) => w.slot_id), yes_count: max };
}

export function hasQuorumOnSlot(slot: PlanSlotWithVotes, quorum: number): boolean {
  return countYesVotes(slot) >= quorum;
}

export function findQuorumSlot(plan: PlanWithSlots): string | null {
  for (const slot of plan.slots) {
    if (hasQuorumOnSlot(slot, plan.quorum)) return slot.id;
  }
  return null;
}

export function hasUserVoted(slot: PlanSlotWithVotes, userId: string): boolean {
  return slot.votes.some((v) => v.user_id === userId);
}

export function hasUserVotedOnAnySlot(plan: PlanWithSlots, userId: string): boolean {
  return plan.slots.some((s) => hasUserVoted(s, userId));
}

export function daysUntilExpiry(expiresAt: string, now: Date = new Date()): number {
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}
