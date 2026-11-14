import type { Event, UserPreferences } from '../types/events';
import { PAST_JOINED_EVENT_IDS } from '../data/mockEvents';
import { INITIAL_PREFERENCES } from '../data/mockUser';
import { savePreferences } from './profileService';
import { tr } from '../i18n';

/*
 * Preferințele utilizatorului și înscrierile la evenimente.
 *
 * - Cu un utilizator logat (Firebase): pornesc din users/{uid} (AuthContext → loadUserPreferences)
 *   și fiecare „Înscrie-te” / „Anulează” se salvează imediat acolo (joinedEventIds, tagScores).
 *   Pe ecran schimbarea apare instant; dacă salvarea eșuează, revine și joinEvent/leaveEvent aruncă eroarea.
 * - Fără Firebase: totul stă în memorie, pornind de la datele mock.
 *
 * Ecranele folosesc doar funcțiile exportate de aici.
 */

/** Cu cât crește scorul unui tag la înscriere. */
export const TAG_SCORE_STEP = 1;

let preferences: UserPreferences = INITIAL_PREFERENCES;
/** Utilizatorul ale cărui preferințe se salvează în Firestore (null = doar în memorie). */
let currentUid: string | null = null;

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

/**
 * Pornește preferințele unui utilizator logat (apelat de AuthContext după ce se încarcă profilul).
 * Scorurile salvate au prioritate; dacă nu există, pornesc de la tag-urile din profil (fiecare cu 1).
 * `uid = null` (ieșire din cont) revine la datele mock, doar în memorie.
 */
export function loadUserPreferences(
  uid: string | null,
  saved: Partial<UserPreferences> | null,
  profileTags: string[],
): void {
  currentUid = uid;
  if (!uid) {
    setPreferences(INITIAL_PREFERENCES);
    return;
  }
  const savedScores = saved?.tagScores;
  const tagScores =
    savedScores && Object.keys(savedScores).length > 0
      ? savedScores
      : Object.fromEntries(profileTags.map((tag) => [tag, 1]));
  // Contul real: doar înscrierile lui (fără istoricul demo).
  const joinedEventIds = [...new Set(saved?.joinedEventIds ?? [])];
  setPreferences({ tagScores, joinedEventIds });
}

/**
 * Pornește scorurile de la tag-urile din profil (fiecare cu scorul 1), păstrând înscrierile.
 * Folosit doar fără Firebase (profilul demo).
 */
export function seedTagScores(profileTags: string[]): void {
  setPreferences({
    tagScores: Object.fromEntries(profileTags.map((tag) => [tag, 1])),
    joinedEventIds: preferences.joinedEventIds,
  });
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

/** Salvările se fac pe rând, fiecare cu starea de atunci (audit: două înscrieri rapide se pierdeau). */
let saving: Promise<void> = Promise.resolve();

/**
 * Aplică schimbarea pe ecran imediat, apoi o salvează. Dacă salvarea eșuează, se anulează doar
 * această schimbare (`undo`), nu și cele făcute între timp.
 */
function commit(change: (p: UserPreferences) => UserPreferences, undo: (p: UserPreferences) => UserPreferences): Promise<void> {
  setPreferences(change(preferences));
  const uid = currentUid;
  if (!uid) return Promise.resolve();
  const attempt = saving.then(async () => {
    if (currentUid !== uid) return;
    try {
      await savePreferences(uid, {
        tagScores: preferences.tagScores,
        joinedEventIds: preferences.joinedEventIds.filter((id) => !PAST_JOINED_EVENT_IDS.includes(id)),
      });
    } catch (e) {
      console.warn('Nu am putut salva înscrierea:', e);
      if (currentUid === uid) setPreferences(undo(preferences));
      throw new Error(tr('Nu am putut salva. Verifică conexiunea la internet și încearcă din nou.'));
    }
  });
  saving = attempt.catch(() => {});
  return attempt;
}

function withEvent(p: UserPreferences, event: Event): UserPreferences {
  if (isJoined(p, event.id)) return p;
  return { tagScores: changeTagScores(p.tagScores, event.tags, TAG_SCORE_STEP), joinedEventIds: [...p.joinedEventIds, event.id] };
}

function withoutEvent(p: UserPreferences, event: Event): UserPreferences {
  if (!isJoined(p, event.id)) return p;
  return {
    tagScores: changeTagScores(p.tagScores, event.tags, -TAG_SCORE_STEP),
    joinedEventIds: p.joinedEventIds.filter((id) => id !== event.id),
  };
}

/** Înscriere: salvează evenimentul și crește scorul tag-urilor lui. */
export async function joinEvent(event: Event): Promise<void> {
  if (isJoined(preferences, event.id)) return;
  await commit(
    (p) => withEvent(p, event),
    (p) => withoutEvent(p, event),
  );
}

/** Anulare: scoate evenimentul și scade la loc scorul tag-urilor. */
export async function leaveEvent(event: Event): Promise<void> {
  if (!isJoined(preferences, event.id)) return;
  await commit(
    (p) => withoutEvent(p, event),
    (p) => withEvent(p, event),
  );
}

/** Cât de potrivit e un eveniment: suma scorurilor tag-urilor lui. */
export function scoreEvent(event: Event, prefs: UserPreferences): number {
  return event.tags.reduce((sum, tag) => sum + (prefs.tagScores[tag] ?? 0), 0);
}
