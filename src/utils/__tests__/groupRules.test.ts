import { describe, expect, it } from '@jest/globals';

import type { CrewGroup, JoinContext, ProposalDraft } from '../../types/groups';
import {
  canOpenChat,
  defaultProposal,
  formationDeadline,
  groupStatus,
  isVisibleTo,
  joinBlockReason,
  profileAge,
  proposalErrors,
} from '../groupRules';

const MIN = 60_000;
const HOUR = 60 * MIN;
const meetup = new Date('2026-11-20T19:45:00+02:00');
const eventStart = new Date('2026-11-20T20:00:00+02:00');
const at = (offsetMs: number) => new Date(meetup.getTime() + offsetMs);

function group(overrides: Partial<CrewGroup> = {}): CrewGroup {
  return {
    id: 'g1',
    eventId: 'e1',
    proposerUid: 'u1',
    meetupAt: meetup,
    meetupPlace: 'în fața intrării',
    minAge: 20,
    maxAge: 28,
    maxSize: 6,
    vibe: 'venim pentru muzică',
    tags: ['Concerte'],
    memberUids: ['u1', 'u2'],
    members: {},
    createdAt: at(-24 * HOUR),
    formedAt: null,
    ...overrides,
  };
}

const okCtx: JoinContext = { age: 24, isRegistered: true, currentGroupId: null, isBlocked: false };

describe('formationDeadline', () => {
  it('is 2 hours before the meetup for groups created earlier', () => {
    expect(formationDeadline({ meetupAt: meetup, createdAt: at(-24 * HOUR) })).toEqual(at(-2 * HOUR));
  });

  it('is 30 minutes before the meetup for groups proposed late', () => {
    expect(formationDeadline({ meetupAt: meetup, createdAt: at(-1 * HOUR) })).toEqual(at(-30 * MIN));
  });
});

describe('groupStatus', () => {
  it('is forming with 2 members before the deadline', () => {
    expect(groupStatus(group(), at(-3 * HOUR))).toBe('forming');
  });

  it('is expired with 2 members after the deadline', () => {
    expect(groupStatus(group(), at(-(HOUR + 59 * MIN)))).toBe('expired');
  });

  it('is formed with 3 members and formedAt set', () => {
    expect(groupStatus(group({ memberUids: ['u1', 'u2', 'u3'], formedAt: at(-5 * HOUR) }), at(-3 * HOUR))).toBe('formed');
  });

  it('stays formed when it drops back to 2 members', () => {
    expect(groupStatus(group({ formedAt: at(-5 * HOUR) }), at(-HOUR))).toBe('formed');
  });

  it('is full when members reach maxSize', () => {
    const g = group({ maxSize: 3, memberUids: ['u1', 'u2', 'u3'], formedAt: at(-5 * HOUR) });
    expect(groupStatus(g, at(-3 * HOUR))).toBe('full');
  });

  it('is closed after the meetup time', () => {
    expect(groupStatus(group({ formedAt: at(-5 * HOUR) }), at(MIN))).toBe('closed');
  });
});

describe('isVisibleTo', () => {
  it('hides groups whose minimum age is above the viewer', () => {
    expect(isVisibleTo(group({ minAge: 18 }), { uid: 'x', age: 17 }, at(-3 * HOUR))).toBe(false);
  });

  it('hides groups whose age range does not include the viewer', () => {
    expect(isVisibleTo(group(), { uid: 'x', age: 30 }, at(-3 * HOUR))).toBe(false);
  });

  it('shows groups whose age range includes the viewer', () => {
    expect(isVisibleTo(group(), { uid: 'x', age: 24 }, at(-3 * HOUR))).toBe(true);
  });

  it('hides expired groups', () => {
    expect(isVisibleTo(group(), { uid: 'x', age: 24 }, at(-HOUR))).toBe(false);
  });

  it('shows closed groups only to members', () => {
    const g = group({ formedAt: at(-5 * HOUR) });
    expect(isVisibleTo(g, { uid: 'u2', age: 24 }, at(MIN))).toBe(true);
    expect(isVisibleTo(g, { uid: 'x', age: 24 }, at(MIN))).toBe(false);
  });
});

describe('joinBlockReason', () => {
  const now = at(-3 * HOUR);

  it('requires registration to the event', () => {
    expect(joinBlockReason(group(), { ...okCtx, isRegistered: false }, now)).toBe('Înscrie-te întâi la eveniment.');
  });

  it('blocks users with confirmed reports', () => {
    expect(joinBlockReason(group(), { ...okCtx, isBlocked: true }, now)).toBe(
      'Nu poți intra în grupulețe o perioadă, din cauza raportărilor.',
    );
  });

  it('blocks full groups', () => {
    const g = group({ maxSize: 3, memberUids: ['u1', 'u2', 'u3'], formedAt: at(-5 * HOUR) });
    expect(joinBlockReason(g, okCtx, now)).toBe('Grupulețul s-a umplut.');
  });

  it('blocks users outside the age range', () => {
    expect(joinBlockReason(group(), { ...okCtx, age: 30 }, now)).toBe('Nu te încadrezi în intervalul de vârstă al grupului.');
  });

  it('blocks joining after the meetup started', () => {
    expect(joinBlockReason(group({ formedAt: at(-5 * HOUR) }), okCtx, at(0))).toBe('Întâlnirea a început deja.');
  });

  it('blocks expired groups', () => {
    expect(joinBlockReason(group(), okCtx, at(-HOUR))).toBe('Grupulețul nu s-a format la timp.');
  });

  it('blocks joining the group you are already in', () => {
    expect(joinBlockReason(group(), { ...okCtx, currentGroupId: 'g1' }, now)).toBe('Ești deja în acest grupuleț.');
  });

  it('allows joining when everything checks out (even if you are in another group)', () => {
    expect(joinBlockReason(group(), { ...okCtx, currentGroupId: 'other' }, now)).toBeNull();
  });
});

describe('defaultProposal', () => {
  it('starts 15 minutes before the event, in front of the entrance, ±4 years, 6 people', () => {
    expect(defaultProposal(eventStart, 25)).toEqual({
      meetupAt: new Date(eventStart.getTime() - 15 * MIN),
      meetupPlace: 'în fața intrării',
      minAge: 21,
      maxAge: 29,
      maxSize: 6,
      vibe: '',
    });
  });

  it('never goes below 18', () => {
    expect(defaultProposal(eventStart, 19).minAge).toBe(18);
  });
});

describe('proposalErrors', () => {
  const now = new Date(eventStart.getTime() - 24 * HOUR);
  const valid = (): ProposalDraft => ({ ...defaultProposal(eventStart, 25), vibe: 'venim pentru muzică' });

  it('accepts a filled-in default proposal', () => {
    expect(proposalErrors(valid(), 25, eventStart, now)).toEqual({});
  });

  it('requires a vibe', () => {
    expect(proposalErrors({ ...valid(), vibe: '  ' }, 25, eventStart, now).vibe).toBeDefined();
  });

  it('limits the vibe to 120 characters', () => {
    expect(proposalErrors({ ...valid(), vibe: 'a'.repeat(121) }, 25, eventStart, now).vibe).toBeDefined();
  });

  it('limits the size to 3–10', () => {
    expect(proposalErrors({ ...valid(), maxSize: 11 }, 25, eventStart, now).maxSize).toBeDefined();
    expect(proposalErrors({ ...valid(), maxSize: 2 }, 25, eventStart, now).maxSize).toBeDefined();
  });

  it('requires a minimum age of at least 18', () => {
    expect(proposalErrors({ ...valid(), minAge: 17 }, 25, eventStart, now).minAge).toBeDefined();
  });

  it('requires the proposer to fit the age range', () => {
    expect(proposalErrors({ ...valid(), minAge: 26, maxAge: 30 }, 25, eventStart, now).minAge).toBeDefined();
  });

  it('requires the meetup to be at or before the event start', () => {
    const late = new Date(eventStart.getTime() + 5 * MIN);
    expect(proposalErrors({ ...valid(), meetupAt: late }, 25, eventStart, now).meetupAt).toBeDefined();
  });

  it('rejects meetups less than 30 minutes away', () => {
    const soon = new Date(eventStart.getTime() - 15 * MIN);
    const nearNow = new Date(soon.getTime() - 20 * MIN);
    expect(proposalErrors({ ...valid(), meetupAt: soon }, 25, eventStart, nearNow).meetupAt).toBe(
      'Întâlnirea e prea aproape: alege cu cel puțin 30 de minute înainte.',
    );
  });
});

describe('profileAge', () => {
  it('uses the stored age for old profiles without a birth date', () => {
    expect(profileAge({ birthDate: null, age: 24 }, new Date('2026-11-20T12:00:00'))).toBe(24);
  });

  it('computes the age from the birth date', () => {
    expect(profileAge({ birthDate: '2000-11-21', age: 0 }, new Date('2026-11-20T12:00:00'))).toBe(25);
  });
});

describe('final review fixes', () => {
  it('opens the chat only for groups that actually formed', () => {
    expect(canOpenChat(group({ formedAt: at(-5 * HOUR) }))).toBe(true);
    expect(canOpenChat(group())).toBe(false);
  });

  it('shows an expired group to its own members (so they learn it did not form), not to others', () => {
    expect(isVisibleTo(group(), { uid: 'u1', age: 24 }, at(-HOUR))).toBe(true);
    expect(isVisibleTo(group(), { uid: 'x', age: 24 }, at(-HOUR))).toBe(false);
  });

  it('hides groups that have no members left', () => {
    expect(isVisibleTo(group({ memberUids: [] }), { uid: 'x', age: 24 }, at(-3 * HOUR))).toBe(false);
    expect(isVisibleTo(group({ memberUids: [], formedAt: at(-5 * HOUR) }), { uid: 'x', age: 24 }, at(-3 * HOUR))).toBe(false);
  });

  it('does not allow joining a group with no members left', () => {
    expect(joinBlockReason(group({ memberUids: [] }), okCtx, at(-3 * HOUR))).toBe('Grupulețul nu mai există.');
  });

  it('rejects a meetup exactly 30 minutes away (the server needs strictly more)', () => {
    const now = new Date(eventStart.getTime() - 24 * HOUR);
    const d = { ...defaultProposal(eventStart, 25), vibe: 'x' };
    const exact = new Date(d.meetupAt.getTime() - 30 * 60_000);
    expect(proposalErrors(d, 25, eventStart, exact).meetupAt).toBeDefined();
    expect(proposalErrors(d, 25, eventStart, now)).toEqual({});
  });
});
