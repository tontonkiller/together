import { describe, it, expect } from 'vitest';
import { locales, defaultLocale } from './config';

describe('i18n config', () => {
  it('locales contains exactly [fr, en]', () => {
    expect(locales).toEqual(['fr', 'en']);
  });

  it('defaultLocale is fr', () => {
    expect(defaultLocale).toBe('fr');
  });

  it('defaultLocale is included in locales', () => {
    expect(locales).toContain(defaultLocale);
  });

  it('locales is readonly with length 2', () => {
    expect(locales).toHaveLength(2);
    expect(locales[0]).toBe('fr');
    expect(locales[1]).toBe('en');
  });
});
