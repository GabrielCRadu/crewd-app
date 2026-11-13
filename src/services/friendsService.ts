import AsyncStorage from '@react-native-async-storage/async-storage';

import { FRIENDS, placeAround } from '../data/mockSocial';
import type { Event, LatLng } from '../types/events';
import type { Friend } from '../types/social';
import { formatDay, formatTime, isLive } from '../utils/dates';
import { haversineKm } from '../utils/distance';
import { isUpcomingOrLive, sortByDate } from '../utils/eventFilters';

/*
 * Prietenii de pe hartă și vizibilitatea locației mele.
 *
 * DEMO: nu există încă o listă reală de prieteni și nici locații partajate. Prietenii sunt cei
 * mock din mockSocial.ts, așezați în jurul locației dispozitivului, iar alegerea „Locația mea e
 * vizibilă pentru prieteni” se ține minte doar pe acest dispozitiv (AsyncStorage).
 * Când vin datele reale (Firestore), se schimbă doar acest fișier; ecranele folosesc
 * hook-urile din src/hooks/useFriends.ts și src/hooks/useLocationVisibility.ts.
 */

/** Un prieten gata de afișat pe hartă. */
export interface FriendOnMap {
  id: string;
  name: string;
  coordinate: LatLng;
  /** Distanța până la mine, în km. */
  distanceKm: number;
  /** Ce face acum, ex. „La Hamlet, acum”. */
  status: string;
  /** Evenimentul din status („Vezi evenimentul”); null dacă nu merge nicăieri. */
  eventId: string | null;
}

/** Evenimentul la care merge prietenul: întâi unul în desfășurare, altfel cel mai apropiat ca dată. */
function findFriendEvent(friend: Friend, events: Event[], now: number): Event | null {
  const going = sortByDate(events.filter((e) => isUpcomingOrLive(e, now) && e.friendsGoing.includes(friend.name)));
  return going.find((e) => isLive(e, now)) ?? going[0] ?? null;
}

function eventStatus(event: Event, now: number): string {
  if (isLive(event, now)) return `La ${event.title}, acum`;
  return `La ${event.title}, ${formatDay(event.startsAt, new Date(now)).toLowerCase()} de la ${formatTime(event.startsAt)}`;
}

/**
 * Prietenii mei, cu poziția și distanța față de `me`.
 * Statusul și evenimentul vin din `events` (cine merge), ca harta să spună același lucru ca detaliile evenimentului.
 */
export function getFriendsOnMap(me: LatLng, events: Event[], now = Date.now()): FriendOnMap[] {
  return FRIENDS.map((friend) => {
    const coordinate = placeAround(me, friend.offset);
    const event = findFriendEvent(friend, events, now);
    return {
      id: friend.id,
      name: friend.name,
      coordinate,
      distanceKm: haversineKm(me, coordinate),
      status: event ? eventStatus(event, now) : 'Nu e la niciun eveniment acum',
      eventId: event?.id ?? null,
    };
  });
}

// ---------- Vizibilitatea locației mele ----------

const VISIBILITY_KEY = 'crewd.locationVisibleToFriends';

/** Implicit locația e vizibilă (ca în ghidul de layout), până alege utilizatorul altceva. */
let locationVisible = true;
let loadStarted = false;
/** true după ce utilizatorul a apăsat switch-ul: valoarea citită târziu de pe disc nu o mai suprascrie. */
let changedByUser = false;

const listeners = new Set<() => void>();

function setLocationVisibleValue(next: boolean) {
  if (locationVisible === next) return;
  locationVisible = next;
  listeners.forEach((listener) => listener());
}

/** Citește o singură dată alegerea salvată pe dispozitiv. */
function loadSavedVisibility() {
  if (loadStarted) return;
  loadStarted = true;
  AsyncStorage.getItem(VISIBILITY_KEY)
    .then((saved) => {
      if (saved !== null && !changedByUser) setLocationVisibleValue(saved === 'true');
    })
    .catch((e) => console.warn('Nu am putut citi vizibilitatea locației:', e));
}

export function getLocationVisible(): boolean {
  return locationVisible;
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToLocationVisible(listener: () => void): () => void {
  listeners.add(listener);
  loadSavedVisibility();
  return () => {
    listeners.delete(listener);
  };
}

/** Schimbă vizibilitatea: pe ecran apare imediat, apoi se salvează pe dispozitiv. */
export function setLocationVisible(next: boolean): void {
  changedByUser = true;
  setLocationVisibleValue(next);
  AsyncStorage.setItem(VISIBILITY_KEY, String(next)).catch((e) =>
    console.warn('Nu am putut salva vizibilitatea locației:', e),
  );
}
