import type { UserPreferences } from '../types/events';

/**
 * Preferințele de start ale utilizatorului (tag-urile alese la crearea profilului,
 * ca în macheta: Concerte, Filme, Socializare, Electronică, Jazz, Board games).
 * Mai târziu vor veni din documentul users/{uid} din Firestore.
 */
export const INITIAL_PREFERENCES: UserPreferences = {
  tagScores: { concerte: 1, filme: 1, socializare: 1, electronica: 1, jazz: 1, 'board-games': 1 },
  joinedEventIds: [],
};
