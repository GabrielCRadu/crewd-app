import { INITIAL_MY_RATINGS, INITIAL_REPUTATION } from '../data/mockRatings';
import { PEOPLE } from '../data/mockSocial';
import type { Event } from '../types/events';
import type { EventRatings, RatingTag, Reputation } from '../types/ratings';
import type { Person } from '../types/social';

/*
 * Evaluările de după evenimente (tag-uri pozitive sau raport).
 *
 * Acum totul stă în memorie (se resetează când repornești aplicația).
 * Cu Firestore, fiecare evaluare devine un document în ratings/{eventId}_{fromUid}_{toUid},
 * iar o Cloud Function adună totalurile în users/{toUid}.reputation. Regulile de securitate
 * nu lasă pe nimeni să citească documentele din ratings/, doar totalurile, ca să rămână anonime.
 *
 * Ecranele folosesc doar funcțiile exportate de aici.
 */

/** Evaluările tale: eventId → (personId → evaluare). */
export type MyRatings = Record<string, EventRatings>;

let myRatings: MyRatings = INITIAL_MY_RATINGS;

const listeners = new Set<() => void>();

export function getMyRatings(): MyRatings {
  return myRatings;
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToRatings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Ai evaluat deja oamenii de la acest eveniment? */
export function hasRated(ratings: MyRatings, eventId: string): boolean {
  return eventId in ratings;
}

/** Salvează (sau înlocuiește) evaluările tale pentru un eveniment. */
export async function saveEventRatings(eventId: string, ratings: EventRatings): Promise<void> {
  myRatings = { ...myRatings, [eventId]: ratings };
  listeners.forEach((listener) => listener());
}

/**
 * Oamenii cu care ai fost la eveniment.
 * Mock: persoanele din mockSocial.ts care apar la „merg și ei”. Cu date reale: membrii grupului de chat.
 */
export function getCompanions(event: Event): Person[] {
  return PEOPLE.filter((p) => event.friendsGoing.includes(p.name));
}

const EMPTY_COUNTS: Record<RatingTag, number> = { friendly: 0, punctual: 0, again: 0 };

/** Totalurile unei persoane: ce au dat alții, plus ce ai dat tu. Nu spune cine ce a dat. */
export function getReputation(ratings: MyRatings, personId: string): Reputation {
  const base = INITIAL_REPUTATION[personId];
  const tagCounts = { ...(base?.tagCounts ?? EMPTY_COUNTS) };
  let reportsCount = base?.reportsCount ?? 0;

  for (const eventRatings of Object.values(ratings)) {
    const mine = eventRatings[personId];
    if (!mine) continue;
    if (mine.reported) reportsCount += 1;
    for (const tag of mine.tags) tagCounts[tag] += 1;
  }
  return { tagCounts, reportsCount };
}
