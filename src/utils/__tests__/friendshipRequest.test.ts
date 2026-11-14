import { describe, expect, it } from '@jest/globals';

import { requestAction } from '../friendshipRules';

describe('requestAction', () => {
  it('creates a request when nothing exists', () => {
    expect(requestAction(null, 'me')).toBe('create');
  });
  it('accepts when the other person already asked', () => {
    expect(requestAction({ status: 'pending', requestedBy: 'u1' }, 'me')).toBe('accept');
  });
  it('does nothing when I already asked or we are friends', () => {
    expect(requestAction({ status: 'pending', requestedBy: 'me' }, 'me')).toBe('none');
    expect(requestAction({ status: 'friends', requestedBy: 'u1' }, 'me')).toBe('none');
  });
});
