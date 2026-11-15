import { describe, expect, it, jest } from '@jest/globals';

import { logIdFor, moderateMessage } from '../moderate';
import type { Classify, Store, StoreAction } from '../moderate';
import { LOG_TTL_MS } from '../rules';

const now = new Date('2026-11-14T12:00:00Z');
const path = 'events/e1/groups/g1/messages/m1';
const message = { authorUid: 'u1', text: 'te găsesc și te bat', createdAt: now };

function fakeStore(logged = false, markFails = false): Store & { actions: StoreAction[]; checked: number } {
  const actions: StoreAction[] = [];
  const store = {
    actions,
    checked: 0,
    alreadyLogged: async () => logged,
    context: async () => [{ authorUid: 'u2', text: 'ce faci' }],
    commit: async (a: StoreAction) => {
      actions.push(a);
    },
    markChecked: async () => {
      if (markFails) throw new Error('scriere eșuată');
      store.checked += 1;
    },
  };
  return store;
}

const answer = (verdict: string, category: string, confidence: number): Classify => async () => ({
  text: JSON.stringify({ verdict, category, confidence, reason: 'test' }),
});

describe('moderateMessage', () => {
  it('writes nothing for an ok message', async () => {
    const store = fakeStore();
    expect(await moderateMessage({ path, message, isDm: false, now }, { classify: answer('ok', 'none', 0.9), store })).toBe('ok');
    expect(store.actions).toEqual([]);
  });

  it('hides a dangerous message and keeps the original in the log for 30 days', async () => {
    const store = fakeStore();
    expect(await moderateMessage({ path, message, isDm: false, now }, { classify: answer('remove', 'threat', 0.95), store })).toBe(
      'remove',
    );
    expect(store.actions).toHaveLength(1);
    const action = store.actions[0]!;
    expect(action.kind).toBe('remove');
    expect(action.logId).toBe(logIdFor(path));
    expect(action.log).toMatchObject({ path, authorUid: 'u1', text: 'te găsesc și te bat', verdict: 'remove', category: 'threat' });
    expect((action.log.expireAt as Date).getTime()).toBe(now.getTime() + LOG_TTL_MS);
  });

  it('does nothing twice (trigger delivered again)', async () => {
    const store = fakeStore(true);
    const classify = jest.fn(answer('remove', 'threat', 0.95));
    expect(await moderateMessage({ path, message, isDm: false, now }, { classify, store })).toBe('skipped');
    expect(classify).not.toHaveBeenCalled();
  });

  it('re-checks the message alone when Gemini blocks the prompt with context', async () => {
    const store = fakeStore();
    const prompts: string[] = [];
    const classify: Classify = async (prompt) => {
      prompts.push(prompt);
      return prompts.length === 1 ? { blocked: 'PROHIBITED_CONTENT' } : { text: '{"verdict":"ok","category":"none","confidence":0.9,"reason":""}' };
    };
    expect(await moderateMessage({ path, message, isDm: false, now }, { classify, store })).toBe('ok');
    expect(prompts[0]).toContain('ce faci');
    expect(prompts[1]).not.toContain('ce faci');
  });

  it('throws on an answer that breaks the schema (so the trigger retries)', async () => {
    const store = fakeStore();
    const classify: Classify = async () => ({ text: '{"verdict":"ok"}' });
    await expect(moderateMessage({ path, message, isDm: false, now }, { classify, store })).rejects.toThrow();
    expect(store.actions).toEqual([]);
  });

  it('describes an event-only DM so it can still be judged', async () => {
    const store = fakeStore();
    const prompts: string[] = [];
    const classify: Classify = async (p) => {
      prompts.push(p);
      return { text: '{"verdict":"ok","category":"none","confidence":0.9,"reason":""}' };
    };
    await moderateMessage({ path, message: { authorUid: 'u1', eventId: 'ev9', createdAt: now }, isDm: true, now }, { classify, store });
    expect(prompts).toEqual([]);
  });

  describe('checked', () => {
    it('marks an ok message as checked', async () => {
      const store = fakeStore();
      await moderateMessage({ path, message, isDm: false, now }, { classify: answer('ok', 'none', 0.9), store });
      expect(store.checked).toBe(1);
    });

    it('marks a flagged message as checked after the log', async () => {
      const store = fakeStore();
      expect(await moderateMessage({ path, message, isDm: false, now }, { classify: answer('flag', 'harassment', 0.7), store })).toBe(
        'flag',
      );
      expect(store.actions).toHaveLength(1);
      expect(store.checked).toBe(1);
    });

    it('marks a skipped message (already logged) as checked', async () => {
      const store = fakeStore(true);
      expect(await moderateMessage({ path, message, isDm: false, now }, { classify: answer('ok', 'none', 0.9), store })).toBe('skipped');
      expect(store.checked).toBe(1);
    });

    it('leaves a removed message to the commit transaction (no separate write)', async () => {
      const store = fakeStore();
      await moderateMessage({ path, message, isDm: false, now }, { classify: answer('remove', 'threat', 0.95), store });
      expect(store.actions[0]!.kind).toBe('remove');
      expect(store.checked).toBe(0);
    });

    it('does not mark a message whose check failed (it goes to the re-check queue)', async () => {
      const store = fakeStore();
      const classify: Classify = async () => {
        throw new Error('503');
      };
      await expect(moderateMessage({ path, message, isDm: false, now }, { classify, store })).rejects.toThrow();
      expect(store.checked).toBe(0);
    });

    it('marks a message once the queue re-check succeeds', async () => {
      const store = fakeStore();
      const old = { ...message, createdAt: new Date(now.getTime() - 60 * 60_000) };
      expect(await moderateMessage({ path, message: old, isDm: false, now, fromQueue: true }, { classify: answer('ok', 'none', 0.9), store })).toBe('ok');
      expect(store.checked).toBe(1);
    });

    it('keeps the verdict and warns when writing checked fails', async () => {
      const store = fakeStore(false, true);
      const warn = jest.fn();
      expect(await moderateMessage({ path, message, isDm: false, now }, { classify: answer('ok', 'none', 0.9), store, warn })).toBe('ok');
      expect(warn).toHaveBeenCalledWith('moderation_mark_checked_failed', expect.objectContaining({ path }));
    });
  });
});
