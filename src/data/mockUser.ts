import type { UserPreferences } from '../types/events';

/**
 * Preferințele de start ale utilizatorului (cele alese la crearea profilului).
 * Mai târziu vor veni din documentul users/{uid} din Firestore.
 */
export const INITIAL_PREFERENCES: UserPreferences = {
  tagScores: { rock: 3, teatru: 1 },
  joinedEventIds: [],
};
