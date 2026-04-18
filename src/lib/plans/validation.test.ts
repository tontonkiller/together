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
    { date: '2026-05-15', time: '19:00', position: 0 },
    { date: '2026-05-16', time: null, position: 1 },
  ];
  const base = {
    title: 'Apéro',
    description: 'test',
    duration: '1h',
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

  it('rejects invalid duration', () => {
    expect(validatePlanInput({ ...base, duration: 'foo' }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'invalidDuration',
    });
  });

  it('rejects quorum <= 0', () => {
    expect(validatePlanInput({ ...base, quorum: 0 }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'invalidQuorum',
    });
    expect(validatePlanInput({ ...base, quorum: -1 }, MEMBERS)).toEqual({
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
    expect(validatePlanInput({ ...base, slots: [] }, MEMBERS)).toEqual({
      valid: false,
      errorKey: 'minTwoSlots',
    });
  });

  it('rejects bad slot date', () => {
    expect(
      validatePlanInput(
        { ...base, slots: [{ date: 'bad', time: null, position: 0 }, baseSlots[1]] },
        MEMBERS,
      ),
    ).toEqual({ valid: false, errorKey: 'invalidSlotDate' });
  });

  it('accepts slot with null time', () => {
    expect(validateSlotInput({ date: '2026-05-15', time: null, position: 0 })).toEqual({
      valid: true,
    });
  });

  it('rejects malformed time', () => {
    expect(validateSlotInput({ date: '2026-05-15', time: '25:99', position: 0 })).toEqual({
      valid: false,
      errorKey: 'invalidSlotTime',
    });
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
  it('normalizes input', () => {
    const result = extractPlanInput({
      title: '  Apéro  ',
      description: '',
      duration: '2h',
      quorum: 3,
      slots: [
        { date: '2026-05-15', time: '19:00', position: 0 },
        { date: '2026-05-16', time: null, position: 1 },
      ],
    });
    expect(result).toMatchObject({
      title: 'Apéro',
      description: null,
      duration: '2h',
      quorum: 3,
    });
    expect(result?.slots).toHaveLength(2);
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
