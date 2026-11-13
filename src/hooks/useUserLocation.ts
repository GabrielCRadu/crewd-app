import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '../types/events';
import { haversineKm } from '../utils/distance';

/** Centrul Timișoarei (Piața Victoriei). Folosit dacă nu avem locația reală. */
export const CITY_CENTER: LatLng = { latitude: 45.7537, longitude: 21.2257 };

/** Dacă ești mai departe de atât de oraș, folosim centrul (ca demo-ul să aibă sens). */
const MAX_KM_FROM_CITY = 50;

/**
 * - loading: încă așteptăm
 * - granted: avem locația reală
 * - denied: utilizatorul a refuzat permisiunea
 * - outside-city: locația e prea departe de Timișoara
 * - error: nu am putut lua locația
 */
export type LocationStatus = 'loading' | 'granted' | 'denied' | 'outside-city' | 'error';

export interface UserLocation {
  coords: LatLng;
  status: LocationStatus;
}

async function loadLocation(): Promise<UserLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { coords: CITY_CENTER, status: 'denied' };

    // Întâi încercăm ultima locație cunoscută (e instantă), apoi una nouă.
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

    const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    if (haversineKm(coords, CITY_CENTER) > MAX_KM_FROM_CITY) {
      return { coords: CITY_CENTER, status: 'outside-city' };
    }
    return { coords, status: 'granted' };
  } catch {
    return { coords: CITY_CENTER, status: 'error' };
  }
}

// Cerem locația o singură dată și o refolosim pe toate ecranele.
let cachedLocation: Promise<UserLocation> | null = null;

/** Locația utilizatorului (sau centrul orașului, dacă nu o avem). */
export function useUserLocation(): UserLocation {
  const [location, setLocation] = useState<UserLocation>({ coords: CITY_CENTER, status: 'loading' });

  useEffect(() => {
    let active = true;
    if (!cachedLocation) cachedLocation = loadLocation();
    cachedLocation.then((result) => {
      if (active) setLocation(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return location;
}

/** Mesajul discret afișat când folosim centrul orașului (sau null dacă nu e nevoie). */
export function getLocationNotice(status: LocationStatus): string | null {
  switch (status) {
    case 'denied':
      return 'Fără acces la locație: distanțele sunt calculate de la centrul Timișoarei.';
    case 'outside-city':
      return 'Ești în afara Timișoarei: distanțele sunt calculate de la centrul orașului.';
    case 'error':
      return 'Nu am putut afla locația: folosim centrul Timișoarei.';
    default:
      return null;
  }
}
