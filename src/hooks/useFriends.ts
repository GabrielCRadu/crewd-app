import { useSyncExternalStore } from 'react';

import { getFriendsState, subscribeToFriends } from '../services/friendsService';
import type { FriendsState } from '../services/friendsService';

/** Prieteniile tale. Componenta se re-desenează la orice cerere acceptată, trimisă sau anulată. */
export function useFriends(): FriendsState {
  return useSyncExternalStore(subscribeToFriends, getFriendsState);
}
