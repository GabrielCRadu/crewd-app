import { describe, expect, it } from '@jest/globals';

import { isThemePreference, nativeColorScheme, resolveColorScheme } from '../themePreference';

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

describe('nativeColorScheme', () => {
  it('passes an explicit choice to the system', () => {
    expect(nativeColorScheme('light')).toBe('light');
    expect(nativeColorScheme('dark')).toBe('dark');
  });

  it('lets the phone decide for "system"', () => {
    expect(nativeColorScheme('system')).toBe('unspecified');
  });
});
