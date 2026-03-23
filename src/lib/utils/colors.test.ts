import { describe, it, expect } from 'vitest';
import { getMemberColor, MEMBER_COLORS } from './colors';

describe('getMemberColor', () => {
  it('returns the first color for index 0', () => {
    expect(getMemberColor(0)).toBe('#1976D2');
  });

  it('returns correct color for each index within range', () => {
    MEMBER_COLORS.forEach((color, i) => {
      expect(getMemberColor(i)).toBe(color);
    });
  });

  it('wraps around when index exceeds array length', () => {
    expect(getMemberColor(10)).toBe(MEMBER_COLORS[0]);
    expect(getMemberColor(11)).toBe(MEMBER_COLORS[1]);
    expect(getMemberColor(20)).toBe(MEMBER_COLORS[0]);
  });

  it('handles large indices', () => {
    expect(getMemberColor(100)).toBe(MEMBER_COLORS[0]);
    expect(getMemberColor(103)).toBe(MEMBER_COLORS[3]);
  });

  it('always returns a string', () => {
    for (let i = 0; i < 25; i++) {
      expect(typeof getMemberColor(i)).toBe('string');
      expect(getMemberColor(i)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe('MEMBER_COLORS', () => {
  it('contains exactly 10 colors', () => {
    expect(MEMBER_COLORS).toHaveLength(10);
  });

  it('all colors are unique', () => {
    const unique = new Set(MEMBER_COLORS);
    expect(unique.size).toBe(MEMBER_COLORS.length);
  });

  it('all colors are valid hex codes', () => {
    MEMBER_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
