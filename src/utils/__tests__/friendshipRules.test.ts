import { describe, expect, it } from '@jest/globals';

import type { FriendshipDoc } from '../friendshipRules';
import { newIncomingRequests, pairId, realFriendsState } from '../friendshipRules';

describe('pairId', () => {
  it('builds the same pair id in both orders', () => {
    expect(pairId('b', 'a')).toBe('a_b');
    expect(pairId('a', 'b')).toBe('a_b');
  });
});

describe('realFriendsState', () => {
  it('maps pending requests by who asked', () => {
    const docs: FriendshipDoc[] = [
      { id: 'a_me', users: ['a', 'me'], status: 'pending', requestedBy: 'me' },
      { id: 'b_me', users: ['b', 'me'], status: 'pending', requestedBy: 'b' },
      { id: 'c_me', users: ['c', 'me'], status: 'friends', requestedBy: 'c' },
    ];
    expect(realFriendsState('me', docs, [])).toEqual({ a: 'outgoing', b: 'incoming', c: 'friends' });
  });

  it('lets a block win over any friendship', () => {
    const docs: FriendshipDoc[] = [{ id: 'c_me', users: ['c', 'me'], status: 'friends', requestedBy: 'c' }];
    expect(realFriendsState('me', docs, ['c'])).toEqual({ c: 'blocked' });
  });
});

describe('newIncomingRequests', () => {
  it('announces no request on the first snapshot', () => {
    expect(newIncomingRequests(null, { b: 'incoming' })).toEqual([]);
  });

  it('announces only requests that are new', () => {
    expect(newIncomingRequests({ b: 'incoming' }, { b: 'incoming', d: 'incoming', c: 'friends' })).toEqual(['d']);
  });

  it('does not announce the same snapshot twice', () => {
    const s = { b: 'incoming' as const };
    expect(newIncomingRequests(s, s)).toEqual([]);
  });
});
