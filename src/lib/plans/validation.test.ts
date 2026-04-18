import { describe, it, expect } from 'vitest';
import {
  validatePlanInput,
  validateSlotInput,
  validateVoteInput,
  validateResolveInput,
  extractPlanInput,
  extractVotes,
} from './validation';

describe('validatePlanInput', () => {
  const MEMBERS = 5;
  const baseSlots = [
    {
      start_date: '2026-05-15',
      end_date: '2026-05-15',
      start_time: '19:00',
      end_time: '22:00',
      position: 0,
    },
    {
      start_date: '2026-05-20',
      end_date: '2026-05-25',
      start_time: null,
      end_time: null,
      position: 1,
    },
  ];
  const base = {
    title: 'Vacances',
    description: 'test',
    quorum: 2,
    slots: baseSlots,
  };

  it('accepts valid input', () => {
    expect(validatePlanInput(base, MEMBERS)).toEqual({ valid: true });
  });

  it('rejects non-object input', () => {
    expect(validatePlanInput(null, MEMBERS)).toEqual({ valid: false, errorKey: 'invalidBody' });
    expect(validatePlanInput('string', MEMBERS)).toEqual({ valid: false, errorKey: 'invalidBody' });
  });

  it('rejects empty title', () => {
    expect(validatePlanInput({ ...base, title: '' }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'titleRequired',
    });
    expect(validatePlanInput({ ...base, title: '   ' }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'titleRequired',
    });
  });

  it('rejects quorum <= 0', () => {
    expect(validatePlanInput({ ...base, quorum: 0 }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'invalidQuorum',
    });
  });

  it('rejects quorum > member count', () => {
    expect(validatePlanInput({ ...base, quorum: 6 }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'quorumExceedsMembers',
    });
  });

  it('rejects fewer than 2 slots', () => {
    expect(validatePlanInput({ ...base, slots: [baseSlots[0]] }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'minTwoSlots',
    });
  });

  it('rejects bad slot start_date', () => {
    expect(
      validatePlanInput(
        { ...base, slots: [{ start_date: 'bad', end_date: 'bad', position: 0 }, baseSlots[1]] },
        MEMBERS,
      ),
    ).toEqual({ valid: false, errorKey: 'invalidSlotDate' });
  });

  it('rejects end_date before start_date', () => {
    expect(
      validatePlanInput(
        {
          ...base,
          slots: [
            { start_date: '2026-05-20', end_date: '2026-05-15', position: 0 },
            baseSlots[1],
          ],
        },
        MEMBERS,
      ),
    ).toEqual({ valid: false, errorKey: 'slotEndBeforeStart' });
  });

  it('accepts slot with null times', () => {
    expect(
      validateSlotInput({
        start_date: '2026-05-15',
        end_date: '2026-05-15',
        start_time: null,
        end_time: null,
        position: 0,
      }),
    ).toEqual({ valid: true });
  });

  it('rejects malformed time', () => {
    expect(
      validateSlotInput({
        start_date: '2026-05-15',
        end_date: '2026-05-15',
        start_time: '25:99',
        position: 0,
      }),
    ).toEqual({ valid: false, errorKey: 'invalidSlotTime' });
  });
});

describe('validateVoteInput', () => {
  it('accepts empty votes array', () => {
    expect(validateVoteInput({ votes: [] })).toEqual({ valid: true });
  });

  it('accepts valid votes', () => {
    expect(
      validateVoteInput({
        votes: [
          { slot_id: 'abc', available: true },
          { slot_id: 'def', available: false },
        ],
      }),
    ).toEqual({ valid: true });
  });

  it('rejects non-boolean available', () => {
    expect(validateVoteInput({ votes: [{ slot_id: 'abc', available: 'yes' }] })).toEqual({
      valid: false,
      errorKey: 'invalidVoteAvailable',
    });
  });

  it('rejects missing slot_id', () => {
    expect(validateVoteInput({ votes: [{ available: true }] })).toEqual({
      valid: false,
      errorKey: 'invalidVoteSlotId',
    });
  });

  it('rejects non-array votes', () => {
    expect(validateVoteInput({})).toEqual({ valid: false, errorKey: 'votesRequired' });
  });
});

describe('validateResolveInput', () => {
  it('accepts valid slot_id', () => {
    expect(validateResolveInput({ slot_id: 'abc-123' })).toEqual({ valid: true });
  });

  it('rejects missing slot_id', () => {
    expect(validateResolveInput({})).toEqual({ valid: false, errorKey: 'invalidSlotId' });
    expect(validateResolveInput({ slot_id: '' })).toEqual({
      valid: false,
      errorKey: 'invalidSlotId',
    });
  });
});

describe('extractPlanInput', () => {
  it('normalizes input and defaults end_date to start_date', () => {
    const result = extractPlanInput({
      title: '  Apéro  ',
      description: '',
      quorum: 3,
      slots: [
        { start_date: '2026-05-15', start_time: '19:00', end_time: '22:00', position: 0 },
        { start_date: '2026-05-16', end_date: '2026-05-20', position: 1 },
      ],
    });
    expect(result).toMatchObject({
      title: 'Apéro',
      description: null,
      quorum: 3,
    });
    expect(result?.slots[0].end_date).toBe('2026-05-15');
    expect(result?.slots[1].end_date).toBe('2026-05-20');
  });
});

describe('extractVotes', () => {
  it('filters out malformed entries', () => {
    const result = extractVotes({
      votes: [
        { slot_id: 'a', available: true },
        { slot_id: 'b' },
        'garbage',
        { slot_id: 'c', available: false },
      ],
    });
    expect(result).toEqual([
      { slot_id: 'a', available: true },
      { slot_id: 'c', available: false },
    ]);
  });
});
