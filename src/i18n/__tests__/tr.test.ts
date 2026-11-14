import { afterEach, describe, expect, it } from '@jest/globals';

import { getLanguage, setLanguage, tr } from '../index';
import { EN } from '../en';

describe('tr', () => {
  afterEach(async () => {
    await setLanguage('ro');
  });

  it('keeps Romanian by default', () => {
    expect(getLanguage()).toBe('ro');
    expect(tr('Evenimente')).toBe('Evenimente');
  });

  it('translates to English', async () => {
    await setLanguage('en');
    expect(tr('Evenimente')).toBe('Events');
  });

  it('fills in parameters in both languages', async () => {
    expect(tr('Vezi profilul lui {name}', { name: 'Maria' })).toBe('Vezi profilul lui Maria');
    await setLanguage('en');
    expect(tr('Vezi profilul lui {name}', { name: 'Maria' })).toBe("See Maria's profile");
  });

  it('falls back to Romanian when a translation is missing', async () => {
    await setLanguage('en');
    expect(tr('Un text fără traducere')).toBe('Un text fără traducere');
  });

  it('uses the context after | only for the English lookup', async () => {
    expect(tr('Intră|grup')).toBe('Intră');
    await setLanguage('en');
    expect(tr('Intră|grup')).toBe('Join');
    expect(tr('Intră')).toBe('Log in');
  });

  it('has no empty translations', () => {
    expect(Object.entries(EN).filter(([, v]) => v.trim() === '')).toEqual([]);
  });
});
