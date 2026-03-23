import { describe, it, expect } from 'vitest';
import { locales, defaultLocale } from './config';

describe('i18n config', () => {
  it('has fr and en as supported locales', () => {
    expect(locales).toContain('fr');
    expect(locales).toContain('en');
  });

  it('has exactly 2 locales', () => {
    expect(locales).toHaveLength(2);
  });

  it('defaults to French', () => {
    expect(defaultLocale).toBe('fr');
  });

  it('default locale is in the locales array', () => {
    expect(locales).toContain(defaultLocale);
  });
});
