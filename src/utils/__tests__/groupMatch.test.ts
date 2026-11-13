import { describe, expect, it } from '@jest/globals';

import type { CrewGroup, MemberSummary } from '../../types/groups';
import { commonTags, matchScore, sortGroupsForUser } from '../groupMatch';

const HOUR = 3_600_000;
const meetup = new Date('2026-11-20T19:45:00+02:00');
const now = new Date(meetup.getTime() - 5 * HOUR);

function member(tags: string[]): MemberSummary {
  return { name: 'X', age: 24, tags };
}

function group(id: string, overrides: Partial<CrewGroup> = {}): CrewGroup {
  return {
    id,
    eventId: 'e1',
    proposerUid: 'u1',
    meetupAt: meetup,
    meetupPlace: 'în fața intrării',
    minAge: 20,
    maxAge: 28,
    maxSize: 6,
    vibe: 'vibe',
    tags: [],
    memberUids: ['u1', 'u2', 'u3'],
    members: {},
    createdAt: new Date(meetup.getTime() - 24 * HOUR),
    formedAt: new Date(meetup.getTime() - 10 * HOUR),
    ...overrides,
  };
}

const forming = { memberUids: ['u1', 'u2'], formedAt: null };
const myTags = ['Concerte', 'Rock', 'Jazz', 'Board games'];

describe('commonTags', () => {
  it('collects my tags found on the group or its members, without duplicates, in my order', () => {
    const g = group('a', { tags: ['Rock'], members: { u1: member(['Rock', 'Jazz']), u2: member(['Pop']) } });
    expect(commonTags(g, myTags)).toEqual(['Rock', 'Jazz']);
  });
});

describe('matchScore', () => {
  it('prefers the age closer to the middle of the range when tags are equal', () => {
    const near = group('near', { minAge: 22, maxAge: 26 });
    const far = group('far', { minAge: 18, maxAge: 22 });
    expect(matchScore(near, myTags, 24)).toBeGreaterThan(matchScore(far, myTags, 24));
  });
});

describe('sortGroupsForUser', () => {
  it('puts the formed group with more common tags first', () => {
    const one = group('one', { tags: ['Rock'] });
    const three = group('three', { tags: ['Rock', 'Jazz', 'Concerte'] });
    expect(sortGroupsForUser([one, three], myTags, 24, now).map((g) => g.id)).toEqual(['three', 'one']);
  });

  it('puts formed groups before forming ones, even with a lower score', () => {
    const formed = group('formed', { tags: [] });
    const formingBetter = group('forming', { ...forming, tags: ['Rock', 'Jazz', 'Concerte'] });
    expect(sortGroupsForUser([formingBetter, formed], myTags, 24, now).map((g) => g.id)).toEqual(['formed', 'forming']);
  });

  it('puts full groups after forming ones', () => {
    const full = group('full', { maxSize: 3, tags: ['Rock', 'Jazz'] });
    const formingOne = group('forming', { ...forming });
    expect(sortGroupsForUser([full, formingOne], myTags, 24, now).map((g) => g.id)).toEqual(['forming', 'full']);
  });

  it('leaves out expired groups', () => {
    const expired = group('expired', { ...forming });
    const late = new Date(meetup.getTime() - HOUR);
    expect(sortGroupsForUser([expired], myTags, 24, late)).toEqual([]);
  });
});
