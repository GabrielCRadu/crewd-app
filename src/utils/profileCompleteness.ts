import type { UserProfile } from '../types/user';

type Parts = Pick<UserProfile, 'photoUrl'> & { username?: string | null };

/** Ce îi lipsește unui profil vechi (de dinainte de username-uri și poza obligatorie). */
export function missingProfileParts(p: Parts): { username: boolean; photo: boolean } {
  return { username: !p.username, photo: !p.photoUrl };
}

/** Profilul are username și poză (altfel apare „Completează-ți profilul” înainte de tab-uri). */
export function isProfileComplete(p: Parts): boolean {
  const missing = missingProfileParts(p);
  return !missing.username && !missing.photo;
}
