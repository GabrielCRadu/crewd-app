import { describe, expect, it } from '@jest/globals';

import { applyThresholds, blockedOutcome, buildPrompt, parseVerdict, shouldSkip } from '../rules';

const now = new Date('2026-11-14T12:00:00Z');

describe('parseVerdict', () => {
  it('reads a valid answer', () => {
    expect(parseVerdict('{"verdict":"remove","category":"threat","confidence":0.92,"reason":"amenințare"}')).toEqual({
      verdict: 'remove',
      category: 'threat',
      confidence: 0.92,
      reason: 'amenințare',
    });
  });

  it('throws on invalid JSON, missing fields or unknown values', () => {
    expect(() => parseVerdict('not json')).toThrow();
    expect(() => parseVerdict('{"verdict":"ok"}')).toThrow();
    expect(() => parseVerdict('{"verdict":"maybe","category":"none","confidence":0.5,"reason":""}')).toThrow();
    expect(() => parseVerdict('{"verdict":"ok","category":"weird","confidence":0.5,"reason":""}')).toThrow();
  });
});

describe('applyThresholds', () => {
  const v = (verdict: 'ok' | 'flag' | 'remove', category: 'threat' | 'self_harm', confidence: number) => ({
    verdict,
    category,
    confidence,
    reason: '',
  });

  it('removes only when very sure', () => {
    expect(applyThresholds(v('remove', 'threat', 0.84)).verdict).toBe('flag');
    expect(applyThresholds(v('remove', 'threat', 0.9)).verdict).toBe('remove');
  });

  it('never removes self-harm, only flags it', () => {
    expect(applyThresholds(v('remove', 'self_harm', 0.99)).verdict).toBe('flag');
    expect(applyThresholds(v('ok', 'self_harm', 0.5)).verdict).toBe('flag');
  });
});

describe('shouldSkip', () => {
  it('skips demo authors, old messages and already removed ones', () => {
    expect(shouldSkip({ authorUid: 'demo-ana', createdAt: now }, now)).toBe(true);
    expect(shouldSkip({ authorUid: 'u1', createdAt: new Date(now.getTime() - 11 * 60_000) }, now)).toBe(true);
    expect(shouldSkip({ authorUid: 'u1', createdAt: now, removed: { category: 'threat' } }, now)).toBe(true);
    expect(shouldSkip({ authorUid: 'u1', createdAt: now }, now)).toBe(false);
  });
});

describe('buildPrompt', () => {
  it('hides who wrote what and marks the message to judge', () => {
    const prompt = buildPrompt({ authorUid: 'uidBob', text: 'te prind eu' }, [
      { authorUid: 'uidAna', text: 'salut' },
      { authorUid: 'uidBob', text: 'ce faci' },
    ]);
    expect(prompt).not.toContain('uidAna');
    expect(prompt).not.toContain('uidBob');
    expect(prompt).toContain('A: salut');
    expect(prompt).toContain('B: ce faci');
    expect(prompt).toContain('<<<MESAJ_DE_VERIFICAT>>>');
    expect(prompt).toContain('B: te prind eu');
  });
});

describe('blockedOutcome', () => {
  it('re-checks alone when the block may come from the context', () => {
    expect(blockedOutcome('PROHIBITED_CONTENT', false)).toBe('recheck');
  });

  it('removes when the message alone is prohibited content', () => {
    expect(blockedOutcome('PROHIBITED_CONTENT', true)).toMatchObject({ verdict: 'remove', category: 'sexual' });
  });

  it('only flags any other block of the message alone', () => {
    expect(blockedOutcome('SAFETY', true)).toMatchObject({ verdict: 'flag' });
    expect(blockedOutcome(undefined, true)).toMatchObject({ verdict: 'flag' });
  });
});
