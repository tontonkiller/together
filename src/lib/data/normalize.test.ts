import { describe, it, expect } from 'vitest';
import { normalizeGroupMembers } from './normalize';

const group = { id: 'g1', name: 'Alpha', description: 'A group' };
const group2 = { id: 'g2', name: 'Beta', description: null };

describe('normalizeGroupMembers', () => {
  it('passes through an object (runtime shape) as-is', () => {
    const result = normalizeGroupMembers([
      { group_id: 'm1', role: 'admin', groups: group },
    ]);
    expect(result).toEqual([{ group_id: 'm1', role: 'admin', groups: group }]);
  });

  it('unwraps a single-element array to the object', () => {
    const result = normalizeGroupMembers([
      { group_id: 'm1', role: 'member', groups: [group] },
    ]);
    expect(result).toEqual([
      { group_id: 'm1', role: 'member', groups: group },
    ]);
  });

  it('normalizes an empty array to null', () => {
    const result = normalizeGroupMembers([
      { group_id: 'm1', role: 'member', groups: [] },
    ]);
    expect(result).toEqual([
      { group_id: 'm1', role: 'member', groups: null },
    ]);
  });

  it('keeps null as null', () => {
    const result = normalizeGroupMembers([
      { group_id: 'm1', role: 'viewer', groups: null },
    ]);
    expect(result).toEqual([
      { group_id: 'm1', role: 'viewer', groups: null },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(normalizeGroupMembers([])).toEqual([]);
  });

  it('handles multiple members with mixed shapes', () => {
    const result = normalizeGroupMembers([
      { group_id: 'm1', role: 'admin', groups: group },
      { group_id: 'm2', role: 'member', groups: [group2] },
      { group_id: 'm3', role: 'viewer', groups: null },
      { group_id: 'm4', role: 'member', groups: [] },
    ]);
    expect(result).toEqual([
      { group_id: 'm1', role: 'admin', groups: group },
      { group_id: 'm2', role: 'member', groups: group2 },
      { group_id: 'm3', role: 'viewer', groups: null },
      { group_id: 'm4', role: 'member', groups: null },
    ]);
  });
});
