import { describe, expect, it, jest } from '@jest/globals';

import { logIdFor, moderateMessage } from '../moderate';
import type { Classify, Store, StoreAction } from '../moderate';
import { LOG_TTL_MS } from '../rules';

const now = new Date('2026-11-14T12:00:00Z');
const path = 'events/e1/groups/g1/messages/m1';
const message = { authorUid: 'u1', text: 'te găsesc și te bat', createdAt: now };

function fakeStore(logged = false): Store & { actions: StoreAction[] } {
  const actions: StoreAction[] = [];
  return {
    actions,
    alreadyLogged: async () => logged,
    context: async () => [{ authorUid: 'u2', text: 'ce faci' }],
    commit: async (a) => {
      actions.push(a);
    },
  };
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
});
