import { describe, expect, it } from '@jest/globals';

import type { UserProfile } from '../../types/user';
import { parsePublicProfile, profileRouteFor, publicProfileKey, toPublicProfile } from '../publicProfile';

const PHOTO = 'data:image/jpeg;base64,AAAA';

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'u1',
    name: 'Ana',
    birthDate: '2000-01-01',
    age: 26,
    city: 'Timișoara',
    gender: 'female',
    bio: 'Îmi place jazz-ul.',
    photoUrl: PHOTO,
    photoThumb: 'data:image/jpeg;base64,BB',
    username: 'ana.pop',
    chosenTags: { events: ['Concerte'], music: ['Jazz'], hobbies: ['Drumeții'] },
    learnedTags: ['Teatru', 'Jazz'],
    ...overrides,
  };
}

describe('toPublicProfile', () => {
  it('keeps only the public fields', () => {
    expect(toPublicProfile(profile())).toEqual({
      uid: 'u1',
      name: 'Ana',
      age: 26,
      city: 'Timișoara',
      bio: 'Îmi place jazz-ul.',
      photoUrl: PHOTO,
      username: 'ana.pop',
      tags: ['Concerte', 'Jazz', 'Drumeții', 'Teatru'],
    });
  });

  it('never exposes the birth date, gender or thumbnail', () => {
    const pub = toPublicProfile(profile()) as unknown as Record<string, unknown>;
    expect(pub.birthDate).toBeUndefined();
    expect(pub.gender).toBeUndefined();
    expect(pub.photoThumb).toBeUndefined();
  });

  it('uses null for a missing username', () => {
    expect(toPublicProfile(profile({ username: undefined })).username).toBeNull();
  });

  it('caps the tags at 60', () => {
    const many = Array.from({ length: 80 }, (_, i) => `t${i}`);
    expect(toPublicProfile(profile({ learnedTags: many })).tags).toHaveLength(60);
  });
});

describe('publicProfileKey', () => {
  it('changes when a public field changes', () => {
    expect(publicProfileKey(toPublicProfile(profile()))).not.toBe(publicProfileKey(toPublicProfile(profile({ bio: 'Altceva' }))));
  });

  it('stays the same when only private fields change', () => {
    expect(publicProfileKey(toPublicProfile(profile()))).toBe(
      publicProfileKey(toPublicProfile(profile({ photoThumb: 'data:image/jpeg;base64,CC' }))),
    );
  });
});

describe('parsePublicProfile', () => {
  it('reads a stored document', () => {
    expect(
      parsePublicProfile('u1', { name: 'Ana', age: 26, city: 'Timișoara', bio: 'x', photoUrl: PHOTO, username: 'ana.pop', tags: ['Jazz'] }),
    ).toEqual({ uid: 'u1', name: 'Ana', age: 26, city: 'Timișoara', bio: 'x', photoUrl: PHOTO, username: 'ana.pop', tags: ['Jazz'] });
  });

  it('fills safe defaults for missing or wrong fields', () => {
    expect(parsePublicProfile('u2', { name: 'Ion', tags: 'nu e listă', age: '30' })).toEqual({
      uid: 'u2',
      name: 'Ion',
      age: null,
      city: '',
      bio: '',
      photoUrl: null,
      username: null,
      tags: [],
    });
  });

  it('rejects a document without a name', () => {
    expect(parsePublicProfile('u3', {})).toBeNull();
  });
});

describe('profileRouteFor', () => {
  it('opens a test person in their full test profile', () => {
    expect(profileRouteFor('p1', { isTestPerson: true, eventId: 'e', groupId: 'g' })).toEqual({
      name: 'PersonProfile',
      params: { personId: 'p1' },
    });
  });

  it('opens a real account in the member profile', () => {
    expect(profileRouteFor('u1', { isTestPerson: false, eventId: 'e', groupId: 'g' })).toEqual({
      name: 'MemberProfile',
      params: { eventId: 'e', groupId: 'g', uid: 'u1' },
    });
  });
});
