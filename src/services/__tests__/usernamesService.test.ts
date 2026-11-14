import { describe, expect, it, jest } from '@jest/globals';

import {
  UsernameTakenError,
  claimUsername,
  isUsernameAvailable,
  lookupUsername,
  releaseUsername,
  resolveInviteTarget,
  updatePublicCard,
} from '../usernamesService';

// Ca fără .env.local: fără Firebase, serviciul folosește depozitul din memorie.
jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }));

describe('usernamesService (in memory)', () => {
  it('knows the usernames of the test people', async () => {
    expect(await isUsernameAvailable('maria')).toBe(false);
  });

  it('reports a free username as available', async () => {
    expect(await isUsernameAvailable('radu.g')).toBe(true);
  });

  it('refuses invalid and reserved usernames', async () => {
    expect(await isUsernameAvailable('admin')).toBe(false);
    expect(await isUsernameAvailable('Ra')).toBe(false);
  });

  it('treats the dot and the underscore as the same character', async () => {
    await claimUsername('u1', { username: 'radu.g', name: 'Radu', photoThumb: null });
    expect(await isUsernameAvailable('radu_g')).toBe(false);
    await expect(claimUsername('u2', { username: 'radu_g', name: 'Alt Radu', photoThumb: null })).rejects.toBeInstanceOf(
      UsernameTakenError,
    );
  });

  it('finds the public card of a username', async () => {
    await claimUsername('u3', { username: 'ioana.b', name: 'Ioana', photoThumb: null });
    expect(await lookupUsername('ioana.b')).toEqual({ username: 'ioana.b', uid: 'u3', name: 'Ioana', photoThumb: null });
    expect(await lookupUsername('nimeni')).toBeNull();
  });

  it('updates the photo on the public card', async () => {
    await claimUsername('u4', { username: 'mihai.c', name: 'Mihai', photoThumb: null });
    await updatePublicCard('mihai.c', { photoThumb: 'data:x' });
    expect((await lookupUsername('mihai.c'))?.photoThumb).toBe('data:x');
  });

  it('frees a username when the account is deleted', async () => {
    await claimUsername('u5', { username: 'elena.d', name: 'Elena', photoThumb: null });
    await releaseUsername('elena.d');
    expect(await isUsernameAvailable('elena.d')).toBe(true);
  });
});

describe('resolveInviteTarget', () => {
  it('opens the full profile of a test person', () => {
    expect(resolveInviteTarget('maria', 'radu.g')).toEqual({ kind: 'person', personId: 'p1' });
  });

  it('ignores your own username', () => {
    expect(resolveInviteTarget('radu.g', 'radu.g')).toEqual({ kind: 'self' });
  });

  it('opens the public card of anyone else', () => {
    expect(resolveInviteTarget('altcineva', 'radu.g')).toEqual({ kind: 'public', username: 'altcineva' });
  });
});
