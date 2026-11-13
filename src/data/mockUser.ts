import type { UserPreferences } from '../types/events';
import { PAST_JOINED_EVENT_IDS } from './mockEvents';
import { MY_TAGS } from './mockSocial';

/**
 * Preferințele de start: tag-urile din profil (src/data/mockSocial.ts), fiecare cu scorul 1,
 * și câteva evenimente trecute la care ai fost (ca istoricul din Profil să nu fie gol).
 * Mai târziu vor veni din documentul users/{uid} din Firestore.
 */
export const INITIAL_PREFERENCES: UserPreferences = {
  tagScores: Object.fromEntries(MY_TAGS.map((tag) => [tag, 1])),
  joinedEventIds: [...PAST_JOINED_EVENT_IDS],
};
