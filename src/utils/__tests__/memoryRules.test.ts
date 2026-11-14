import { describe, expect, it } from '@jest/globals';

import type { Memory, MemoryViewer } from '../../types/memories';
import { canSeeMemory, hiddenMemoriesCount, isSharedMemory, sortMemories, visibleMemories } from '../memoryRules';

const DAY = 86_400_000;
const base = new Date('2026-11-13T20:00:00+02:00').getTime();

function memory(id: string, overrides: Partial<Memory> = {}): Memory {
  return {
    id,
    ownerId: 'p1',
    eventId: 'e1',
    eventTitle: 'Concert',
    eventDate: new Date(base),
    photoUri: `file:///${id}.jpg`,
    visibility: 'everyone',
    createdAt: new Date(base + DAY),
    ...overrides,
  };
}

const owner: MemoryViewer = { isOwner: true, isFriend: false };
const friend: MemoryViewer = { isOwner: false, isFriend: true };
const stranger: MemoryViewer = { isOwner: false, isFriend: false };

const ids = (memories: Memory[]) => memories.map((m) => m.id);

describe('cine vede o amintire', () => {
  const forAll = memory('a');
  const forFriends = memory('b', { visibility: 'friends' });

  it('o amintire pentru toți o vede oricine', () => {
    expect(canSeeMemory(forAll, owner)).toBe(true);
    expect(canSeeMemory(forAll, friend)).toBe(true);
    expect(canSeeMemory(forAll, stranger)).toBe(true);
  });

  it('una doar pentru prieteni o văd proprietarul și prietenii, nu și ceilalți', () => {
    expect(canSeeMemory(forFriends, owner)).toBe(true);
    expect(canSeeMemory(forFriends, friend)).toBe(true);
    expect(canSeeMemory(forFriends, stranger)).toBe(false);
  });

  it('visibleMemories și hiddenMemoriesCount se potrivesc', () => {
    const all = [forAll, forFriends, memory('c', { visibility: 'friends' })];
    expect(ids(visibleMemories(all, stranger))).toEqual(['a']);
    expect(hiddenMemoriesCount(all, stranger)).toBe(2);
    expect(ids(visibleMemories(all, friend))).toEqual(['a', 'b', 'c']);
    expect(hiddenMemoriesCount(all, friend)).toBe(0);
    expect(hiddenMemoriesCount(all, owner)).toBe(0);
  });
});

describe('ordinea din grilă', () => {
  it('cele mai recente evenimente sunt primele', () => {
    const old = memory('old', { eventId: 'e1', eventDate: new Date(base - 5 * DAY) });
    const recent = memory('recent', { eventId: 'e2', eventDate: new Date(base) });
    expect(ids(sortMemories([old, recent]))).toEqual(['recent', 'old']);
  });

  it('la același eveniment, poza adăugată ultima e prima', () => {
    const first = memory('first', { createdAt: new Date(base + DAY) });
    const second = memory('second', { createdAt: new Date(base + 2 * DAY) });
    expect(ids(sortMemories([first, second]))).toEqual(['second', 'first']);
  });

  it('amintirile de la evenimentele la care ați fost împreună urcă primele', () => {
    const recent = memory('recent', { eventId: 'e2', eventDate: new Date(base) });
    const sharedOld = memory('shared', { eventId: 'e1', eventDate: new Date(base - 9 * DAY) });
    expect(isSharedMemory(sharedOld, ['e1'])).toBe(true);
    expect(isSharedMemory(recent, ['e1'])).toBe(false);
    expect(ids(sortMemories([recent, sharedOld], ['e1']))).toEqual(['shared', 'recent']);
  });

  it('nu modifică lista primită', () => {
    const list = [memory('a', { eventDate: new Date(base - DAY) }), memory('b')];
    sortMemories(list);
    expect(ids(list)).toEqual(['a', 'b']);
  });
});
