import { describe, expect, it } from '@jest/globals';

import type { GroupMessage } from '../../types/chat';
import type { CrewGroup } from '../../types/groups';
import { dmReadKey, groupInitials, groupReadKey, isUnread, shortWhen, sortGroupsByActivity, toneIndex } from '../chatListRules';

const group = (id: string, meetupAt: string): CrewGroup => ({
  id,
  eventId: 'e1',
  proposerUid: 'u1',
  meetupAt: new Date(meetupAt),
  meetupPlace: 'Intrare',
  minAge: 18,
  maxAge: 30,
  maxSize: 5,
  vibe: '',
  tags: [],
  memberUids: ['u1', 'u2', 'u3'],
  members: {},
  createdAt: new Date('2026-11-01T10:00:00Z'),
  formedAt: new Date('2026-11-01T11:00:00Z'),
});

const msg = (at: string): GroupMessage => ({ id: at, authorUid: 'u2', authorName: 'Ana', text: 'hei', createdAt: new Date(at) });

describe('isUnread', () => {
  const at = new Date('2026-11-14T10:00:00Z');
  it('no message or my own message is never unread', () => {
    expect(isUnread(null, undefined)).toBe(false);
    expect(isUnread({ at, mine: true }, undefined)).toBe(false);
  });
  it('a message newer than the last read is unread', () => {
    expect(isUnread({ at, mine: false }, at.getTime() - 1)).toBe(true);
    expect(isUnread({ at, mine: false }, undefined)).toBe(true);
  });
  it('a message read at or after it is read', () => {
    expect(isUnread({ at, mine: false }, at.getTime())).toBe(false);
    expect(isUnread({ at, mine: false }, at.getTime() + 1000)).toBe(false);
  });
});

describe('read keys', () => {
  it('follow the agreed format', () => {
    expect(groupReadKey('e1', 'g1')).toBe('group:e1/g1');
    expect(dmReadKey('p1')).toBe('dm:p1');
  });
});

describe('sortGroupsByActivity', () => {
  it('puts the most recent message first, then groups without messages by meetup time', () => {
    const a = group('a', '2026-11-20T18:00:00Z');
    const b = group('b', '2026-11-18T18:00:00Z');
    const c = group('c', '2026-11-25T18:00:00Z');
    const d = group('d', '2026-11-19T18:00:00Z');
    const sorted = sortGroupsByActivity([a, b, c, d], {
      c: msg('2026-11-14T09:00:00Z'),
      a: msg('2026-11-14T12:00:00Z'),
      d: null,
    });
    expect(sorted.map((g) => g.id)).toEqual(['a', 'c', 'b', 'd']);
  });
  it('does not change the input', () => {
    const list = [group('a', '2026-11-20T18:00:00Z'), group('b', '2026-11-18T18:00:00Z')];
    sortGroupsByActivity(list, {});
    expect(list.map((g) => g.id)).toEqual(['a', 'b']);
  });
});

describe('shortWhen', () => {
  it('shows the time today and the day otherwise', () => {
    const now = new Date(2026, 10, 14, 20, 0);
    expect(shortWhen(new Date(2026, 10, 14, 18, 2), now)).toBe('18:02');
    expect(shortWhen(new Date(2026, 10, 13, 18, 2), now)).toBe('Ieri');
  });
});

describe('groupInitials', () => {
  it('takes the first letters of the first two words', () => {
    expect(groupInitials('Open Mic Night')).toBe('OM');
    expect(groupInitials('  jazz  în parc ')).toBe('JÎ');
  });
  it('takes two letters of a single word and skips punctuation', () => {
    expect(groupInitials('Concert')).toBe('CO');
    expect(groupInitials('— Untold')).toBe('UN');
    expect(groupInitials('"Rock" & Roll')).toBe('RR');
  });
  it('falls back to ? for an empty title', () => {
    expect(groupInitials('   ')).toBe('?');
  });
});

describe('toneIndex', () => {
  it('is stable and inside the palette', () => {
    for (const title of ['Open Mic', 'Jazz', 'Untold', '', 'Ăâîșț']) {
      const i = toneIndex(title, 6);
      expect(i).toBe(toneIndex(title, 6));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(6);
    }
  });
  it('spreads different titles over more than one tone', () => {
    const titles = ['Open Mic', 'Jazz', 'Untold', 'Electric Castle', 'Teatru', 'Stand-up', 'Film'];
    expect(new Set(titles.map((t) => toneIndex(t, 6))).size).toBeGreaterThan(1);
  });
  it('handles an empty palette', () => {
    expect(toneIndex('x', 0)).toBe(0);
  });
});
