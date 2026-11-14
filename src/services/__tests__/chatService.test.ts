import { describe, expect, it, jest } from '@jest/globals';

import type { GroupMessage } from '../../types/chat';
import {
  ChatActionError,
  LEFT_GROUP_MESSAGE,
  chatErrorMessage,
  sendGroupMessage,
  subscribeToGroupMessages,
  subscribeToLastMessage,
} from '../chatService';

// Ca fără .env.local: fără Firebase, serviciul folosește depozitul din memorie.
// (Modulul real cere AsyncStorage, care nu există în Jest.)
jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }));

function latest<T>(): { values: T[]; cb: (v: T) => void } {
  const values: T[] = [];
  return { values, cb: (v: T) => values.push(v) };
}

const fail = (e: Error) => {
  throw e;
};

describe('chatService (in memory)', () => {
  it('delivers a sent message to the subscribers, trimmed and signed', async () => {
    const seen = latest<GroupMessage[]>();
    const unsubscribe = subscribeToGroupMessages('e1', 'g1', seen.cb, fail);
    await sendGroupMessage('e1', 'g1', { uid: 'u1', name: 'Radu' }, '  Salut  ');
    unsubscribe();

    const last = seen.values[seen.values.length - 1]!;
    expect(last).toHaveLength(1);
    expect(last[0]).toMatchObject({ text: 'Salut', authorUid: 'u1', authorName: 'Radu' });
    expect(last[0]!.createdAt).toBeInstanceOf(Date);
  });

  it('rejects a blank message', async () => {
    await expect(sendGroupMessage('e1', 'g2', { uid: 'u1', name: 'Radu' }, '   ')).rejects.toBeInstanceOf(ChatActionError);
  });

  it('gives the last message of a group', async () => {
    const seen = latest<GroupMessage | null>();
    const unsubscribe = subscribeToLastMessage('e1', 'g3', seen.cb, fail);
    await sendGroupMessage('e1', 'g3', { uid: 'u1', name: 'Radu' }, 'primul');
    await sendGroupMessage('e1', 'g3', { uid: 'u2', name: 'Ana' }, 'al doilea');
    unsubscribe();

    expect(seen.values[seen.values.length - 1]).toMatchObject({ text: 'al doilea', authorName: 'Ana' });
  });

  it('gives null as the last message of an empty group', () => {
    const seen = latest<GroupMessage | null>();
    subscribeToLastMessage('e1', 'empty', seen.cb, fail)();
    expect(seen.values).toEqual([null]);
  });

  it('starts the formed demo groups with a few messages', () => {
    const seen = latest<GroupMessage[]>();
    subscribeToGroupMessages('e9', 'e9-demo-a', seen.cb, fail)();
    expect(seen.values[0]!.length).toBeGreaterThanOrEqual(3);
  });
});

describe('chatErrorMessage', () => {
  it('explains a permission error as having left the group', () => {
    expect(chatErrorMessage({ code: 'permission-denied' })).toBe(LEFT_GROUP_MESSAGE);
    expect(LEFT_GROUP_MESSAGE).toBe('Nu mai ești în acest grup.');
  });

  it('keeps the text of our own errors', () => {
    expect(chatErrorMessage(new ChatActionError('Mesajul e gol.'))).toBe('Mesajul e gol.');
  });

  it('falls back to a network message', () => {
    expect(chatErrorMessage(new Error('unavailable'))).toMatch(/conexiunea/);
  });
});
