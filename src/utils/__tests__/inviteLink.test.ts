import { describe, expect, it } from '@jest/globals';

import { invitePath, usernameFromLink } from '../inviteLink';

describe('invitePath', () => {
  it('puts the username in the invite path', () => {
    expect(invitePath('radu.g')).toBe('invite/radu.g');
  });

  it('is stable for the same person', () => {
    expect(invitePath('radu.g')).toBe(invitePath('radu.g'));
  });
});

describe('usernameFromLink', () => {
  it('reads the installed app link (crewd://invite/radu.g)', () => {
    expect(usernameFromLink({ hostname: 'invite', path: 'radu.g' })).toBe('radu.g');
  });

  it('reads the Expo Go link (exp://ip:8081/--/invite/radu.g)', () => {
    expect(usernameFromLink({ hostname: '192.168.1.5', path: '--/invite/radu.g' })).toBe('radu.g');
    expect(usernameFromLink({ hostname: '192.168.1.5', path: 'invite/radu.g' })).toBe('radu.g');
  });

  it('reads a web-style link (https://domain/invite/radu.g)', () => {
    expect(usernameFromLink({ hostname: 'example.com', path: 'invite/radu.g' })).toBe('radu.g');
  });

  it('refuses a link whose username is not valid', () => {
    expect(usernameFromLink({ hostname: 'invite', path: 'AB' })).toBeNull();
    expect(usernameFromLink({ hostname: 'invite', path: 'Radu.G' })).toBeNull();
  });

  it('ignores links that are not invites', () => {
    expect(usernameFromLink({ hostname: '192.168.1.5', path: '' })).toBeNull();
    expect(usernameFromLink({ hostname: null, path: null })).toBeNull();
    expect(usernameFromLink({ hostname: 'events', path: 'e1' })).toBeNull();
    expect(usernameFromLink({ hostname: 'invite', path: '' })).toBeNull();
  });
});
