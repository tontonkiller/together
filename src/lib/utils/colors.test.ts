import { describe, it, expect } from 'vitest';
import { getMemberColor, getContrastTextColor, MEMBER_COLORS } from './colors';

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

describe('getContrastTextColor', () => {
  it('returns dark text for light backgrounds', () => {
    expect(getContrastTextColor('#AFB42B')).toBe('#212121'); // Lime
    expect(getContrastTextColor('#F57C00')).toBe('#212121'); // Orange
    expect(getContrastTextColor('#FFFFFF')).toBe('#212121'); // White
    expect(getContrastTextColor('#FFEB3B')).toBe('#212121'); // Yellow
  });

  it('returns white text for dark backgrounds', () => {
    expect(getContrastTextColor('#1976D2')).toBe('#fff'); // Blue
    expect(getContrastTextColor('#D32F2F')).toBe('#fff'); // Red
    expect(getContrastTextColor('#7B1FA2')).toBe('#fff'); // Purple
    expect(getContrastTextColor('#5D4037')).toBe('#fff'); // Brown
    expect(getContrastTextColor('#000000')).toBe('#fff'); // Black
    expect(getContrastTextColor('#C2185B')).toBe('#fff'); // Pink
  });

  it('handles hex with or without #', () => {
    expect(getContrastTextColor('#FFFFFF')).toBe('#212121');
    expect(getContrastTextColor('FFFFFF')).toBe('#212121');
  });

  it('returns valid text color for all MEMBER_COLORS', () => {
    MEMBER_COLORS.forEach((color) => {
      const result = getContrastTextColor(color);
      expect(['#fff', '#212121']).toContain(result);
    });
  });
});
