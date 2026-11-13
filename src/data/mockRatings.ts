import type { EventRatings, Reputation } from '../types/ratings';

/*
 * Date mock pentru evaluări.
 * - INITIAL_REPUTATION: ce au primit deja persoanele din mockSocial.ts de la alții (doar totaluri).
 * - INITIAL_MY_RATINGS: evaluările pe care le-ai dat deja (un eveniment trecut e deja evaluat).
 */

/** Id-ul utilizatorului curent în datele mock (cu Firebase: uid-ul din Auth). */
export const ME_ID = 'me';

export const INITIAL_REPUTATION: Record<string, Reputation> = {
  [ME_ID]: { tagCounts: { friendly: 14, punctual: 9, again: 11 }, reportsCount: 0 },
  p1: { tagCounts: { friendly: 14, punctual: 9, again: 11 }, reportsCount: 0 },
  p2: { tagCounts: { friendly: 11, punctual: 4, again: 9 }, reportsCount: 1 },
  p3: { tagCounts: { friendly: 8, punctual: 7, again: 6 }, reportsCount: 0 },
  p4: { tagCounts: { friendly: 5, punctual: 6, again: 3 }, reportsCount: 2 },
};

/** eventId → evaluările tale. Drumeția (e18) e deja evaluată. */
export const INITIAL_MY_RATINGS: Record<string, EventRatings> = {
  e18: { p4: { tags: ['friendly', 'punctual'], reported: false } },
};
