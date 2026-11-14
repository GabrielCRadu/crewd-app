import { describe, expect, it } from '@jest/globals';

import { isNewPhoto } from '../profilePhoto';

describe('isNewPhoto', () => {
  it('is false when the saved changes carry the same photo (e.g. only the bio changed)', () => {
    expect(isNewPhoto({ photoUrl: 'data:image/jpeg;base64,AAA', bio: 'salut' }, 'data:image/jpeg;base64,AAA')).toBe(false);
  });

  it('is false when the photo is not part of the changes', () => {
    expect(isNewPhoto({ bio: 'salut' }, 'data:image/jpeg;base64,AAA')).toBe(false);
  });

  it('is true for a different photo', () => {
    expect(isNewPhoto({ photoUrl: 'data:image/jpeg;base64,BBB' }, 'data:image/jpeg;base64,AAA')).toBe(true);
  });

  it('is true when the photo is removed', () => {
    expect(isNewPhoto({ photoUrl: null }, 'data:image/jpeg;base64,AAA')).toBe(true);
  });
});
