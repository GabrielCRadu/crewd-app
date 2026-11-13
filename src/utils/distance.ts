import type { LatLng } from '../types/events';
import { palette } from '../theme/eventsTheme';

/** Pragurile de distanță (km) pentru culorile pinilor. */
export const NEAR_KM = 2;
export const FAR_KM = 5;

export type DistanceLevel = 'near' | 'medium' | 'far';

/** Verde / galben / roșu (puțin diferite de galbenul și coralul din machetă, ca să nu se confunde). */
export const DISTANCE_COLORS: Record<DistanceLevel, string> = {
  near: palette.green,
  medium: '#F5A300',
  far: '#E5484D',
};

/** Folosit de legenda de pe hartă. */
export const DISTANCE_LEVELS: { level: DistanceLevel; label: string }[] = [
  { level: 'near', label: `< ${NEAR_KM} km` },
  { level: 'medium', label: `${NEAR_KM}–${FAR_KM} km` },
  { level: 'far', label: `> ${FAR_KM} km` },
];

/**
 * Distanța în linie dreaptă între două puncte, în km (formula Haversine).
 * Ține cont că Pământul e rotund, dar nu și de drumuri.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // raza Pământului în km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getDistanceLevel(km: number): DistanceLevel {
  if (km < NEAR_KM) return 'near';
  if (km <= FAR_KM) return 'medium';
  return 'far';
}

export function getDistanceColor(km: number): string {
  return DISTANCE_COLORS[getDistanceLevel(km)];
}

/** Ex: „850 m” sau „2.4 km”. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Zona de hartă care cuprinde ambele puncte (pentru harta mică din detalii). */
export function regionForPoints(a: LatLng, b: LatLng) {
  return {
    latitude: (a.latitude + b.latitude) / 2,
    longitude: (a.longitude + b.longitude) / 2,
    // Puțin mai mare decât distanța dintre puncte, ca să încapă amândouă cu margine.
    latitudeDelta: Math.max(Math.abs(a.latitude - b.latitude) * 1.8, 0.01),
    longitudeDelta: Math.max(Math.abs(a.longitude - b.longitude) * 1.8, 0.01),
  };
}
