import { describe, expect, it, jest } from '@jest/globals';

import type { Event } from '../../types/events';
import * as profile from '../profileService';
import { getPreferences, joinEvent, loadUserPreferences } from '../preferencesService';

jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }));
jest.mock('../profileService', () => ({ savePreferences: jest.fn(async () => {}) }));

const event = (id: string) => ({ id, tags: [`t-${id}`] }) as unknown as Event;

describe('joinEvent', () => {
  it('keeps the second sign-up when only the first save fails', async () => {
    loadUserPreferences('u1', { joinedEventIds: [], tagScores: { x: 1 } }, []);
    let failFirst: (e: Error) => void = () => {};
    jest
      .mocked(profile.savePreferences)
      .mockImplementationOnce(() => new Promise<void>((_, reject) => (failFirst = reject)))
      .mockImplementationOnce(async () => {});

    const first = joinEvent(event('a'));
    const second = joinEvent(event('b'));
    // Salvările sunt la coadă: așteptăm să pornească prima, apoi o facem să eșueze.
    await new Promise((r) => setTimeout(r, 0));
    failFirst(new Error('offline'));
    await expect(first).rejects.toThrow();
    await second;

    const joined = getPreferences().joinedEventIds;
    expect(joined).toContain('b');
    expect(joined).not.toContain('a');
    // Ce s-a salvat ultima oară e exact ce arată ecranul.
    const lastSaved = jest.mocked(profile.savePreferences).mock.calls.at(-1)![1];
    expect(lastSaved.joinedEventIds).toContain('b');
    expect(lastSaved.joinedEventIds).not.toContain('a');
  });
});
