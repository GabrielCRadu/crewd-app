import { useMemo } from 'react';

import { getFriendsOnMap } from '../services/friendsService';
import type { FriendOnMap } from '../services/friendsService';
import type { Event, LatLng } from '../types/events';

/** Prietenii de pe hartă, cu distanța față de `me` și evenimentul la care merg (din `events`). */
export function useFriends(me: LatLng, events: Event[]): FriendOnMap[] {
  return useMemo(() => getFriendsOnMap(me, events), [me, events]);
}
