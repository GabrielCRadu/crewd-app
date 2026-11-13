import type { Event, UserPreferences } from '../types/events';
import { INITIAL_PREFERENCES } from '../data/mockUser';

/*
 * Preferințele utilizatorului și înscrierile la evenimente.
 *
 * Acum totul stă în memorie (se resetează când repornești aplicația).
 * La trecerea pe Firestore, joinEvent/leaveEvent vor scrie în users/{uid}, de exemplu:
 *
 *   await updateDoc(doc(db, 'users', uid), {
 *     joinedEventIds: arrayUnion(event.id),
 *     ...Object.fromEntries(event.tags.map((t) => [`tagScores.${t}`, increment(1)])),
 *   });
 *
 * Ecranele nu trebuie schimbate: ele folosesc doar funcțiile exportate de aici.
 */

/** Cu cât crește scorul unui tag la înscriere. */
export const TAG_SCORE_STEP = 1;

let preferences: UserPreferences = INITIAL_PREFERENCES;

// Cine vrea să afle când se schimbă preferințele (vezi hooks/usePreferences.ts).
const listeners = new Set<() => void>();

function setPreferences(next: UserPreferences) {
  preferences = next;
  listeners.forEach((listener) => listener());
}

export function getPreferences(): UserPreferences {
  return preferences;
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToPreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isJoined(prefs: UserPreferences, eventId: string): boolean {
  return prefs.joinedEventIds.includes(eventId);
}

/** Adună `delta` la scorul fiecărui tag. Scorurile nu scad sub 0; cele ajunse la 0 se șterg. */
function changeTagScores(scores: Record<string, number>, tags: string[], delta: number): Record<string, number> {
  const next = { ...scores };
  for (const tag of tags) {
    const value = Math.max(0, (next[tag] ?? 0) + delta);
    if (value === 0) delete next[tag];
    else next[tag] = value;
  }
  return next;
}

/** Înscriere: salvează evenimentul și crește scorul tag-urilor lui. */
export async function joinEvent(event: Event): Promise<void> {
  if (isJoined(preferences, event.id)) return;
  setPreferences({
    tagScores: changeTagScores(preferences.tagScores, event.tags, TAG_SCORE_STEP),
    joinedEventIds: [...preferences.joinedEventIds, event.id],
  });
}

/** Anulare: scoate evenimentul și scade la loc scorul tag-urilor. */
export async function leaveEvent(event: Event): Promise<void> {
  if (!isJoined(preferences, event.id)) return;
  setPreferences({
    tagScores: changeTagScores(preferences.tagScores, event.tags, -TAG_SCORE_STEP),
    joinedEventIds: preferences.joinedEventIds.filter((id) => id !== event.id),
  });
}

/** Cât de potrivit e un eveniment: suma scorurilor tag-urilor lui. */
export function scoreEvent(event: Event, prefs: UserPreferences): number {
  return event.tags.reduce((sum, tag) => sum + (prefs.tagScores[tag] ?? 0), 0);
}
