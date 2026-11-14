import { describe, expect, it } from '@jest/globals';

import { isThemePreference, resolveColorScheme } from '../themePreference';

describe('resolveColorScheme', () => {
  it('follows the phone when the choice is "system"', () => {
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
  });

  it('uses dark when the phone does not say', () => {
    expect(resolveColorScheme('system', null)).toBe('dark');
    expect(resolveColorScheme('system', undefined)).toBe('dark');
  });

  it('keeps an explicit choice whatever the phone says', () => {
    expect(resolveColorScheme('light', 'dark')).toBe('light');
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
  });
});

describe('isThemePreference', () => {
  it('accepts only the three choices', () => {
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('blue')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});
