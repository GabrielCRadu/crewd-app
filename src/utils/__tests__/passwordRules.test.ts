import { describe, expect, it } from '@jest/globals';

import { PASSWORD_RULES, isStrongPassword, passwordChecks } from '../passwordRules';

describe('passwordChecks', () => {
  it('reports each requirement separately', () => {
    expect(passwordChecks('abcdefgh')).toEqual({ length: true, lower: true, upper: false });
  });

  it('has one label per requirement', () => {
    expect(PASSWORD_RULES.map((r) => r.label)).toEqual(['Minim 8 caractere', 'O literă mică', 'O literă mare']);
  });
});

describe('isStrongPassword', () => {
  it('accepts 8 characters with a lowercase and an uppercase letter', () => {
    expect(isStrongPassword('Abcdefgh')).toBe(true);
  });

  it('refuses 7 characters', () => {
    expect(isStrongPassword('Abcdefg')).toBe(false);
  });

  it('refuses a password without a lowercase letter', () => {
    expect(isStrongPassword('ABCDEFGH')).toBe(false);
  });

  it('refuses a password without an uppercase letter', () => {
    expect(isStrongPassword('abcdefgh')).toBe(false);
  });
});
