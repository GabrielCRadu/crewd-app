import type { UserPreferences } from '../types/events';
import { MY_TAGS } from './mockSocial';

/**
 * Preferințele de start: tag-urile din profil (src/data/mockSocial.ts), fiecare cu scorul 1.
 * Mai târziu vor veni din documentul users/{uid} din Firestore.
 */
export const INITIAL_PREFERENCES: UserPreferences = {
  tagScores: Object.fromEntries(MY_TAGS.map((tag) => [tag, 1])),
  joinedEventIds: [],
};
