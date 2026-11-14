/*
 * Pozele amintirilor în Firestore (fără Storage; spec 2026-11-14-prieteni-amintiri-design.md):
 * o miniatură pentru grilă și poza mare, ca data URI JPEG, fiecare sub limita ei din firestore.rules.
 */

/** Cel mult atâtea caractere are miniatura (~320px). */
export const MEMORY_THUMB_MAX = 40_000;
/** Cel mult atâtea caractere are poza mare (~1080px). */
export const MEMORY_PHOTO_MAX = 700_000;
/** Lățimea miniaturii, în pixeli. */
export const MEMORY_THUMB_WIDTH = 320;
/** Calitatea JPEG cu care se încearcă prima dată. */
export const MEMORY_FIRST_QUALITY = 0.75;

const QUALITY_STEPS = [0.75, 0.6, 0.45, 0.3];

/** Intră poza în limită? */
export function fitsLimit(dataUri: string, max: number): boolean {
  return dataUri.length <= max;
}

/** Următoarea calitate JPEG de încercat când poza e prea mare; null = renunțăm. */
export function nextQuality(current: number): number | null {
  const next = QUALITY_STEPS.find((q) => q < current - 1e-9);
  return next ?? null;
}
