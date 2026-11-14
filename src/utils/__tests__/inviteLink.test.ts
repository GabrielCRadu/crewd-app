import { describe, expect, it } from '@jest/globals';

import { invitePath, personIdFromLink } from '../inviteLink';

describe('invitePath', () => {
  it('builds the invite path', () => {
    expect(invitePath('p4')).toBe('invite/p4');
  });

  it('is stable for the same person', () => {
    expect(invitePath('p4')).toBe(invitePath('p4'));
  });

  it('escapes unusual ids', () => {
    expect(invitePath('a b/c')).toBe('invite/a%20b%2Fc');
  });
});

describe('personIdFromLink', () => {
  it('reads the installed app link (crewd://invite/p4)', () => {
    expect(personIdFromLink({ hostname: 'invite', path: 'p4' })).toBe('p4');
  });

  it('reads the Expo Go link (exp://ip:8081/--/invite/p4)', () => {
    expect(personIdFromLink({ hostname: '192.168.1.5', path: '--/invite/p4' })).toBe('p4');
    expect(personIdFromLink({ hostname: '192.168.1.5', path: 'invite/p4' })).toBe('p4');
  });

  it('reads a web-style link (https://domain/invite/p4)', () => {
    expect(personIdFromLink({ hostname: 'example.com', path: 'invite/p4' })).toBe('p4');
  });

  it('round-trips an escaped id', () => {
    expect(personIdFromLink({ hostname: null, path: invitePath('a b/c') })).toBe('a b/c');
  });

  it('ignores links that are not invites', () => {
    expect(personIdFromLink({ hostname: '192.168.1.5', path: '' })).toBeNull();
    expect(personIdFromLink({ hostname: null, path: null })).toBeNull();
    expect(personIdFromLink({ hostname: 'events', path: 'e1' })).toBeNull();
    expect(personIdFromLink({ hostname: 'invite', path: '' })).toBeNull();
  });
});
