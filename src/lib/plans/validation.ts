import type { PlanInput, PlanSlotInput, VoteInput } from '@/lib/types/plans';

export type ValidationResult = { valid: true } | { valid: false; errorKey: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

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

  if (typeof s.start_date !== 'string' || !DATE_RE.test(s.start_date)) {
    return { valid: false, errorKey: 'invalidSlotDate' };
  }
  if (Number.isNaN(new Date(s.start_date + 'T00:00:00Z').getTime())) {
    return { valid: false, errorKey: 'invalidSlotDate' };
  }

  if (s.end_date !== null && s.end_date !== undefined && s.end_date !== '') {
    if (typeof s.end_date !== 'string' || !DATE_RE.test(s.end_date)) {
      return { valid: false, errorKey: 'invalidSlotDate' };
    }
    if (Number.isNaN(new Date(s.end_date + 'T00:00:00Z').getTime())) {
      return { valid: false, errorKey: 'invalidSlotDate' };
    }
    if (s.end_date < s.start_date) {
      return { valid: false, errorKey: 'slotEndBeforeStart' };
    }
  }

  for (const field of ['start_time', 'end_time'] as const) {
    const v = s[field];
    if (v !== null && v !== undefined && v !== '') {
      if (typeof v !== 'string' || !TIME_RE.test(v)) {
        return { valid: false, errorKey: 'invalidSlotTime' };
      }
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
        .map((s, i) => {
          if (!s || typeof s !== 'object') return null;
          const o = s as Record<string, unknown>;
          const start = String(o.start_date ?? '');
          const end =
            typeof o.end_date === 'string' && o.end_date.length > 0
              ? o.end_date
              : start;
          return {
            start_date: start,
            end_date: end,
            start_time: o.start_time ? String(o.start_time) : null,
            end_time: o.end_time ? String(o.end_time) : null,
            position: typeof o.position === 'number' ? o.position : i,
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
