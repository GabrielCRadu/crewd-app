import { describe, expect, it } from '@jest/globals';

import { canonicalUsername, isKnownTaken, normalizeUsernameInput, usernameError, usernameFromName } from '../usernameRules';

describe('normalizeUsernameInput', () => {
  it('turns capitals into lowercase and drops spaces', () => {
    expect(normalizeUsernameInput('Radu.G ')).toBe('radu.g');
  });

  it('drops characters that are not allowed', () => {
    expect(normalizeUsernameInput('ana maria!')).toBe('anamaria');
  });

  it('keeps only ASCII letters', () => {
    expect(normalizeUsernameInput('Ăla')).toBe('la');
  });

  it('cuts at 20 characters', () => {
    expect(normalizeUsernameInput('a'.repeat(25))).toHaveLength(20);
  });
});

describe('canonicalUsername', () => {
  it('treats the dot like an underscore', () => {
    expect(canonicalUsername('radu.g')).toBe('radu_g');
  });
});

describe('usernameError', () => {
  it('accepts a valid username', () => {
    expect(usernameError('radu.g')).toBeNull();
    expect(usernameError('radu..g')).toBeNull();
    expect(usernameError('sup.port')).toBeNull();
  });

  it('asks for at least 3 characters', () => {
    expect(usernameError('ra')).toContain('3');
  });

  it('allows at most 20 characters', () => {
    expect(usernameError('a'.repeat(21))).toContain('20');
  });

  it('refuses a leading or trailing dot/underscore and capitals', () => {
    const format = usernameError('.radu');
    expect(format).not.toBeNull();
    expect(usernameError('radu_')).toBe(format);
    expect(usernameError('Radu')).toBe(format);
  });

  it('refuses reserved names', () => {
    expect(usernameError('admin')).toContain('rezervat');
    expect(usernameError('crewd')).toContain('rezervat');
    expect(usernameError('help')).toContain('rezervat');
  });
});

describe('usernameFromName', () => {
  it('derives a username for the test people', () => {
    expect(usernameFromName('Maria')).toBe('maria');
    expect(usernameFromName('Ana-Maria')).toBe('anamaria');
  });
});

describe('isKnownTaken', () => {
  it('remembers a username that turned out to be taken, in any dot/underscore form', () => {
    expect(isKnownTaken('radu.g', ['radu_g'])).toBe(true);
    expect(isKnownTaken('radu.g', ['radu.g'])).toBe(true);
  });

  it('does not flag other usernames', () => {
    expect(isKnownTaken('radu.h', ['radu_g'])).toBe(false);
    expect(isKnownTaken('radu.g', [])).toBe(false);
  });
});
