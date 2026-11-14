import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { FriendshipDoc } from '../../utils/friendshipRules';
import * as firestore from '../friendshipsFirestore';
import {
  FriendRequestError,
  getFriendsState,
  sendFriendRequest,
  startFriendsSync,
  stopFriendsSync,
  subscribeToFriendNotices,
} from '../friendsService';
import type { FriendNotice } from '../friendsService';

jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }));

type OnChange = (docs: FriendshipDoc[], blockedUids: string[]) => void;
let onChange: OnChange = () => {};

jest.mock('../friendshipsFirestore', () => ({
  subscribeToMyFriendships: jest.fn((_me: string, cb: OnChange) => {
    onChange = cb;
    return () => {};
  }),
  requestFriendship: jest.fn(async () => {}),
  acceptFriendship: jest.fn(async () => {}),
  deleteFriendship: jest.fn(async () => {}),
  blockUser: jest.fn(async () => {}),
  unblockUser: jest.fn(async () => {}),
}));

const friends = (other: string, status: FriendshipDoc['status'], requestedBy: string): FriendshipDoc => ({
  id: `me_${other}`,
  users: ['me', other],
  status,
  requestedBy,
});

afterEach(() => stopFriendsSync());

describe('friendsService with real accounts', () => {
  it('merges real friendships with test people', () => {
    startFriendsSync('me');
    onChange([friends('u1', 'friends', 'u1')], []);
    expect(getFriendsState().u1).toBe('friends');
    expect(getFriendsState().p1).toBe('friends');
  });

  it('resets real state on stop', () => {
    startFriendsSync('me');
    onChange([friends('u1', 'friends', 'u1')], []);
    stopFriendsSync();
    expect(getFriendsState().u1).toBeUndefined();
  });

  it('announces a request that arrives after the first snapshot', () => {
    const notices: FriendNotice[] = [];
    const unsubscribe = subscribeToFriendNotices((n) => notices.push(n));
    startFriendsSync('me');
    onChange([friends('u2', 'pending', 'u2')], []);
    onChange([friends('u2', 'pending', 'u2'), friends('u3', 'pending', 'u3')], []);
    unsubscribe();
    expect(notices).toEqual([{ kind: 'request', personId: 'u3' }]);
  });

  it('routes a real request to Firestore', async () => {
    startFriendsSync('me');
    await sendFriendRequest('u9');
    expect(firestore.requestFriendship).toHaveBeenCalledWith('me', 'u9');
  });

  it('throws a neutral error when a real request is refused', async () => {
    startFriendsSync('me');
    jest.mocked(firestore.requestFriendship).mockRejectedValueOnce(new Error('permission-denied'));
    await expect(sendFriendRequest('u8')).rejects.toBeInstanceOf(FriendRequestError);
    expect(getFriendsState().u8).toBeUndefined();
  });
});
