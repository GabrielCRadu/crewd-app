import { describe, expect, it } from '@jest/globals';

import type { CrewGroup } from '../../types/groups';
import type { Person } from '../../types/social';
import { friendsAtEvent, groupOwnerName } from '../friendsAtEvent';

const person = (id: string, name: string): Person => ({ id, name, age: 25, distanceKm: 1, tags: [], goingTo: null });

const group = (id: string, memberUids: string[], proposerUid = memberUids[0]!): CrewGroup => ({
  id,
  eventId: 'e1',
  proposerUid,
  meetupAt: new Date(),
  meetupPlace: 'Intrare',
  minAge: 18,
  maxAge: 40,
  maxSize: 6,
  vibe: '',
  tags: [],
  memberUids,
  members: Object.fromEntries(memberUids.map((uid) => [uid, { name: `N-${uid}`, age: 25, tags: [] }])),
  createdAt: new Date(),
  formedAt: null,
});

describe('friendsAtEvent', () => {
  const ana = person('a', 'Ana');
  const bogdan = person('b', 'Bogdan');
  const cristi = person('c', 'Cristi');
  const dana = person('d', 'Dana');

  it('keeps only friends who signed up or are in a group', () => {
    const result = friendsAtEvent({ friends: [ana, bogdan, cristi], goingNames: ['Ana'], groups: [group('g', ['c'])] });
    expect(result.map((f) => f.person.id)).toEqual(['c', 'a']);
  });

  it('puts friends in a group first, then sorts by name', () => {
    const result = friendsAtEvent({
      friends: [dana, cristi, bogdan, ana],
      goingNames: ['Ana', 'Cristi'],
      groups: [group('g1', ['d']), group('g2', ['b'])],
    });
    expect(result.map((f) => f.person.name)).toEqual(['Bogdan', 'Dana', 'Ana', 'Cristi']);
    expect(result[0]!.group?.id).toBe('g2');
    expect(result[2]!.group).toBeNull();
  });

  it('matches signed-up names regardless of case and spaces', () => {
    expect(friendsAtEvent({ friends: [ana], goingNames: [' ana '], groups: [] })).toHaveLength(1);
  });

  it('returns nothing when no friend goes', () => {
    expect(friendsAtEvent({ friends: [ana], goingNames: ['Maria'], groups: [] })).toEqual([]);
  });
});

describe('groupOwnerName', () => {
  it('uses the name of whoever proposed the group', () => {
    expect(groupOwnerName(group('g', ['x', 'y'], 'y'))).toBe('N-y');
  });
});
