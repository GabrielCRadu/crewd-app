import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }));

// AsyncStorage se încarcă prin import dinamic, pe care Jest nu-l rulează: stocarea „eșuează”, iar starea
// trebuie să meargă oricum (în memorie). Combinarea cu ce e salvat se testează pe funcția pură.
type Module = typeof import('../chatReadState');

describe('chatReadState', () => {
  let mod: Module;
  beforeEach(() => {
    jest.resetModules();
    mod = require('../chatReadState') as Module;
  });

  it('marks read, never goes back, and notifies once per change', () => {
    const seen = jest.fn();
    const unsubscribe = mod.subscribeToChatReadState(seen);
    seen.mockClear();
    mod.markChatRead('group:e1/g1', 500);
    mod.markChatRead('group:e1/g1', 300);
    mod.markChatRead('group:e1/g1', 500);
    expect(mod.getChatReadState().lastRead['group:e1/g1']).toBe(500);
    expect(seen).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('becomes loaded even when the storage fails, keeping earlier marks', async () => {
    mod.markChatRead('dm:p1', 100);
    expect(mod.getChatReadState().loaded).toBe(false);
    await mod.loadChatReadState();
    expect(mod.getChatReadState()).toEqual({ loaded: true, lastRead: { 'dm:p1': 100 } });
  });

  it('merges saved and in-memory times keeping the latest per key', () => {
    expect(mod.mergeReadTimes({ 'dm:p1': 100, 'dm:p2': 900 }, { 'dm:p2': 200, 'dm:p3': 50 })).toEqual({
      'dm:p1': 100,
      'dm:p2': 900,
      'dm:p3': 50,
    });
  });
});
