import { useMemo } from 'react';

import { getFriendsOnMap } from '../services/friendsMapService';
import type { FriendOnMap } from '../services/friendsMapService';
import type { Event, LatLng } from '../types/events';
import { isFirebaseConfigured } from '../lib/firebase';

/** Prietenii de pe hartă, cu distanța față de `me` și evenimentul la care merg (din `events`). */
export function useFriendsOnMap(me: LatLng, events: Event[]): FriendOnMap[] {
  // Pozițiile prietenilor nu sunt încă reale: pentru conturile reale harta nu arată prieteni inventați (audit).
  return useMemo(() => (isFirebaseConfigured ? [] : getFriendsOnMap(me, events)), [me, events]);
}
