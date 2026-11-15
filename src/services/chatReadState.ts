import { useEffect, useSyncExternalStore } from 'react';

/*
 * Când ai citit ultima dată fiecare conversație, pe acest telefon (pentru „necitit” din tab-ul Chat).
 * Chei: `group:${eventId}/${groupId}` și `dm:${personId}` (vezi src/utils/chatListRules.ts).
 * Valorile stau în memorie și se salvează în AsyncStorage (încărcat doar când e nevoie, ca tema).
 * Cât timp nu s-a citit ce e salvat, `loaded` e false și nimic nu apare necitit (fără „clipiri”).
 */

export interface ChatReadState {
  loaded: boolean;
  /** cheie → momentul citirii (ms). */
  lastRead: Record<string, number>;
}

const STORAGE_KEY = 'crewd.chatRead';
let state: ChatReadState = { loaded: false, lastRead: {} };
let loading = false;
const listeners = new Set<() => void>();

async function storage() {
  return (await import('@react-native-async-storage/async-storage')).default;
}

function setState(next: ChatReadState): void {
  state = next;
  listeners.forEach((l) => l());
}

/** Păstrează pentru fiecare cheie momentul cel mai târziu. */
export function mergeReadTimes(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  for (const [key, at] of Object.entries(b)) out[key] = Math.max(out[key] ?? 0, at);
  return out;
}

/** Citește ce e salvat (o singură dată); ce s-a marcat între timp nu se pierde. */
export async function loadChatReadState(): Promise<void> {
  if (loading || state.loaded) return;
  loading = true;
  let saved: Record<string, number> = {};
  try {
    const raw = await (await storage()).getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') {
      for (const [key, at] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof at === 'number' && Number.isFinite(at)) saved[key] = at;
      }
    }
  } catch {
    saved = {};
  }
  const marked = Object.keys(state.lastRead).length > 0;
  setState({ loaded: true, lastRead: mergeReadTimes(saved, state.lastRead) });
  if (marked) persist();
}

/** Salvează tot (doar după încărcare, ca să nu suprascrie ce era salvat). */
function persist(): void {
  if (!state.loaded) return;
  const toSave = state.lastRead;
  void (async () => {
    try {
      await (await storage()).setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Nu e grav: rămâne citit până închizi aplicația.
    }
  })();
}

export function getChatReadState(): ChatReadState {
  return state;
}

export function subscribeToChatReadState(listener: () => void): () => void {
  listeners.add(listener);
  void loadChatReadState();
  return () => {
    listeners.delete(listener);
  };
}

/** Marchează conversația ca citită până la `at` (ms). Nu dă niciodată înapoi. */
export function markChatRead(key: string, at: number): void {
  if ((state.lastRead[key] ?? 0) >= at) return;
  setState({ ...state, lastRead: { ...state.lastRead, [key]: at } });
  persist();
}

/** Starea „citit”, ca hook. */
export function useChatReadState(): ChatReadState {
  return useSyncExternalStore(subscribeToChatReadState, getChatReadState, getChatReadState);
}

/**
 * Cât e deschisă o conversație: o marchează citită la deschidere și la fiecare mesaj nou.
 * Ora telefonului poate rămâne în urma serverului, de aceea se ia și ora ultimului mesaj.
 */
export function useMarkChatRead(key: string, newestAt: Date | null | undefined): void {
  const newest = newestAt?.getTime() ?? 0;
  useEffect(() => {
    markChatRead(key, Math.max(Date.now(), newest));
  }, [key, newest]);
}
