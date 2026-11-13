import type { AutoBadgeId, BadgeVotes } from '../types/badges';
import { ME_ID } from './mockRatings';

/*
 * Date mock pentru badge-uri.
 * - INITIAL_BADGE_VOTES: cine a propus deja ce badge fiecărei persoane (votanții `v*` sunt fictivi).
 *   Unele badge-uri au 2 voturi: dacă îl propui și tu, ating pragul de 3 și apar pe profil.
 * - INITIAL_AUTO_BADGES: badge-urile automate ale celorlalți (nu le știm istoricul de evenimente).
 */

export const INITIAL_BADGE_VOTES: Record<string, BadgeVotes> = {
  [ME_ID]: { energy: ['v1', 'v2', 'v3'], funny: ['p1', 'p2', 'p3', 'v4'], organizer: ['v1', 'v5'] },
  p1: { soul: ['v1', 'v2', 'v3'], warm: ['v1', 'v4', 'v5', 'v6'], funny: ['v2', 'v7'] },
  p2: { dancer: ['v1', 'v3', 'v8'], energy: ['v2', 'v9'] },
  p3: { listener: ['v4', 'v5', 'v6'], chill: ['v1', 'v7'] },
  p4: { guide: ['v2', 'v3', 'v9'], reliable: ['v5', 'v8'] },
  p5: { warm: ['v6', 'v7'] },
};

export const INITIAL_AUTO_BADGES: Record<string, AutoBadgeId[]> = {
  p1: ['festivalier'],
  p2: ['party', 'regular'],
  p3: ['theatre'],
  p4: ['explorer'],
};
