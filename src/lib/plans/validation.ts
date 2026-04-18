import type { PlanDuration, PlanInput, PlanSlotInput, VoteInput } from '@/lib/types/plans';

export const VALID_DURATIONS: PlanDuration[] = ['30min', '1h', '2h', '3h', 'half_day', 'full_day'];

export type ValidationResult = { valid: true } | { valid: false; errorKey: string };

export function validatePlanInput(input: unknown, memberCount: number): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, errorKey: 'invalidBody' };
  }
  const d = input as Record<string, unknown>;

  if (typeof d.title !== 'string' || d.title.trim().length === 0) {
    return { valid: false, errorKey: 'titleRequired' };
  }
  if (d.title.length > 200) {
    return { valid: false, errorKey: 'titleTooLong' };
  }

  if (d.description !== null && d.description !== undefined && typeof d.description !== 'string') {
    return { valid: false, errorKey: 'invalidDescription' };
  }

  if (typeof d.duration !== 'string' || !VALID_DURATIONS.includes(d.duration as PlanDuration)) {
    return { valid: false, errorKey: 'invalidDuration' };
  }

  if (typeof d.quorum !== 'number' || !Number.isInteger(d.quorum) || d.quorum <= 0) {
    return { valid: false, errorKey: 'invalidQuorum' };
  }
  if (d.quorum > memberCount) {
    return { valid: false, errorKey: 'quorumExceedsMembers' };
  }

  if (!Array.isArray(d.slots)) {
    return { valid: false, errorKey: 'slotsRequired' };
  }
  if (d.slots.length < 2) {
    return { valid: false, errorKey: 'minTwoSlots' };
  }

  for (const s of d.slots) {
    const slotResult = validateSlotInput(s);
    if (!slotResult.valid) return slotResult;
  }

  return { valid: true };
}

export function validateSlotInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, errorKey: 'invalidSlot' };
  }
  const s = input as Record<string, unknown>;

  if (typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) {
    return { valid: false, errorKey: 'invalidSlotDate' };
  }
  // Basic date sanity check (Date.parse accepts 2026-02-30 → NaN-safe path)
  const parsed = new Date(s.date + 'T00:00:00Z');
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, errorKey: 'invalidSlotDate' };
  }

  if (s.time !== null && s.time !== undefined && s.time !== '') {
    if (typeof s.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(s.time)) {
      return { valid: false, errorKey: 'invalidSlotTime' };
    }
  }

  if (typeof s.position !== 'number' || !Number.isInteger(s.position) || s.position < 0) {
    return { valid: false, errorKey: 'invalidSlotPosition' };
  }

  return { valid: true };
}

export function validateVoteInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, errorKey: 'invalidBody' };
  }
  const d = input as Record<string, unknown>;

  if (!Array.isArray(d.votes)) {
    return { valid: false, errorKey: 'votesRequired' };
  }

  for (const v of d.votes) {
    if (!v || typeof v !== 'object') {
      return { valid: false, errorKey: 'invalidVote' };
    }
    const vote = v as Record<string, unknown>;
    if (typeof vote.slot_id !== 'string' || vote.slot_id.length === 0) {
      return { valid: false, errorKey: 'invalidVoteSlotId' };
    }
    if (typeof vote.available !== 'boolean') {
      return { valid: false, errorKey: 'invalidVoteAvailable' };
    }
  }

  return { valid: true };
}

export function validateResolveInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, errorKey: 'invalidBody' };
  }
  const d = input as Record<string, unknown>;
  if (typeof d.slot_id !== 'string' || d.slot_id.length === 0) {
    return { valid: false, errorKey: 'invalidSlotId' };
  }
  return { valid: true };
}

export function extractPlanInput(input: unknown): PlanInput | null {
  if (!input || typeof input !== 'object') return null;
  const d = input as Record<string, unknown>;
  const slots = Array.isArray(d.slots)
    ? d.slots
        .map((s) => {
          if (!s || typeof s !== 'object') return null;
          const o = s as Record<string, unknown>;
          return {
            date: String(o.date ?? ''),
            time: o.time ? String(o.time) : null,
            position: typeof o.position === 'number' ? o.position : 0,
          } as PlanSlotInput;
        })
        .filter((x): x is PlanSlotInput => x !== null)
    : [];

  return {
    title: String(d.title ?? '').trim(),
    description:
      typeof d.description === 'string' && d.description.trim().length > 0
        ? d.description.trim()
        : null,
    duration: d.duration as PlanDuration,
    quorum: typeof d.quorum === 'number' ? d.quorum : 0,
    slots,
  };
}

export function extractVotes(input: unknown): VoteInput[] {
  if (!input || typeof input !== 'object') return [];
  const d = input as Record<string, unknown>;
  if (!Array.isArray(d.votes)) return [];
  return d.votes
    .map((v) => {
      if (!v || typeof v !== 'object') return null;
      const o = v as Record<string, unknown>;
      if (typeof o.slot_id !== 'string' || typeof o.available !== 'boolean') return null;
      return { slot_id: o.slot_id, available: o.available } as VoteInput;
    })
    .filter((v): v is VoteInput => v !== null);
}
