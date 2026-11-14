import { describe, expect, it } from '@jest/globals';

import { isProfileComplete, missingProfileParts } from '../profileCompleteness';

describe('missingProfileParts', () => {
  it('asks for a username when it is missing', () => {
    expect(missingProfileParts({ username: null, photoUrl: 'x' })).toEqual({ username: true, photo: false });
    expect(missingProfileParts({ photoUrl: 'x' })).toEqual({ username: true, photo: false });
  });

  it('asks for a photo when it is missing', () => {
    expect(missingProfileParts({ username: 'radu', photoUrl: null })).toEqual({ username: false, photo: true });
  });

  it('asks for nothing when both are there', () => {
    expect(missingProfileParts({ username: 'radu', photoUrl: 'x' })).toEqual({ username: false, photo: false });
    expect(isProfileComplete({ username: 'radu', photoUrl: 'x' })).toBe(true);
    expect(isProfileComplete({ username: null, photoUrl: 'x' })).toBe(false);
  });
});
