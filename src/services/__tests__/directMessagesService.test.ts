import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { RemoteDm, RemoteThread } from '../dmFirestore';
import * as remote from '../dmFirestore';
import {
  getDirectThreads,
  openConversation,
  sendDirectText,
  startDmSync,
  stopDmSync,
} from '../directMessagesService';

jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }));

let onThreads: (t: RemoteThread[]) => void = () => {};
let onMessages: (m: RemoteDm[]) => void = () => {};

jest.mock('../dmFirestore', () => ({
  subscribeToMyDms: jest.fn((_me: string, cb: (t: RemoteThread[]) => void) => {
    onThreads = cb;
    return () => {};
  }),
  subscribeToDmMessages: jest.fn((_me: string, _other: string, cb: (m: RemoteDm[]) => void) => {
    onMessages = cb;
    return () => {};
  }),
  sendDm: jest.fn(async () => {}),
}));

const at = new Date('2026-11-14T10:00:00Z');

afterEach(() => stopDmSync());

describe('direct messages with real accounts', () => {
  it('lists a real conversation with its last message, next to the test ones', () => {
    startDmSync('me');
    onThreads([{ other: 'u1', last: { id: 'x', authorUid: 'u1', text: 'Salut', sentAt: at } }]);
    expect(getDirectThreads().u1).toEqual([{ id: 'x', fromMe: false, text: 'Salut', eventId: undefined, sentAt: at }]);
    expect(getDirectThreads().p1?.length).toBeGreaterThan(0);
  });

  it('shows all messages of an opened conversation', () => {
    startDmSync('me');
    openConversation('u1');
    onMessages([
      { id: 'a', authorUid: 'me', text: 'Hei', sentAt: at },
      { id: 'b', authorUid: 'u1', text: 'Salut', sentAt: at },
    ]);
    expect(getDirectThreads().u1?.map((m) => [m.text, m.fromMe])).toEqual([
      ['Hei', true],
      ['Salut', false],
    ]);
  });

  it('sends to Firestore for a real account', async () => {
    startDmSync('me');
    await sendDirectText('u9', '  Ce faci?  ');
    expect(remote.sendDm).toHaveBeenCalledWith('me', 'u9', { text: 'Ce faci?' });
  });

  it('forgets real conversations on stop', () => {
    startDmSync('me');
    onThreads([{ other: 'u1', last: { id: 'x', authorUid: 'u1', text: 'Salut', sentAt: at } }]);
    stopDmSync();
    expect(getDirectThreads().u1).toBeUndefined();
  });
});
