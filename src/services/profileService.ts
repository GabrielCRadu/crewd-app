import { Timestamp, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';
import type { UserPreferences } from '../types/events';
import type { ProfileChanges, ProfileDraft, UserProfile } from '../types/user';
import { ageFromBirthDate } from '../utils/birthDate';

/*
 * Profilul utilizatorului în Firestore: users/{uid}.
 * Regulile permit fiecăruia să-și citească și să-și scrie doar propriul document, și blochează
 * schimbarea datei nașterii și a genului după crearea profilului (firestore.rules).
 */

function requireDb() {
  if (!db) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return db;
}

/** „AAAA-LL-ZZ” → Timestamp la miezul nopții UTC din acea zi (ca regulile să poată verifica vârsta). */
function birthDateToTimestamp(s: string): Timestamp {
  const [y, m, d] = s.split('-').map(Number);
  return Timestamp.fromDate(new Date(Date.UTC(y!, m! - 1, d!)));
}

/** Timestamp (miezul nopții UTC) → „AAAA-LL-ZZ”. */
function timestampToBirthDate(t: Timestamp): string {
  const d = t.toDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Profilul utilizatorului, sau null dacă nu a terminat încă onboarding-ul. */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  const birthDate = d.birthDate instanceof Timestamp ? timestampToBirthDate(d.birthDate) : null;
  return {
    uid,
    name: d.name ?? '',
    birthDate,
    // Profilurile vechi (create înainte de data nașterii) au doar `age`.
    age: birthDate ? ageFromBirthDate(birthDate) : (d.age ?? 0),
    city: d.city ?? '',
    gender: d.gender ?? 'other',
    bio: d.bio ?? '',
    photoUrl: d.photoUrl ?? null,
    photoThumb: d.photoThumb ?? null,
    chosenTags: {
      events: d.chosenTags?.events ?? [],
      music: d.chosenTags?.music ?? [],
      hobbies: d.chosenTags?.hobbies ?? [],
    },
    learnedTags: d.learnedTags ?? [],
  };
}

/** Creează profilul la finalul onboarding-ului. */
export async function createProfile(uid: string, draft: ProfileDraft): Promise<UserProfile> {
  const profile: UserProfile = {
    uid,
    ...draft,
    age: ageFromBirthDate(draft.birthDate),
    bio: '',
    photoUrl: null,
    learnedTags: [],
  };
  await setDoc(doc(requireDb(), 'users', uid), {
    name: profile.name,
    birthDate: birthDateToTimestamp(draft.birthDate),
    city: profile.city,
    gender: profile.gender,
    bio: '',
    photoUrl: null,
    chosenTags: profile.chosenTags,
    learnedTags: [],
    joinedEventIds: [],
    tagScores: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return profile;
}

/** Salvează „Despre mine”. */
export async function setBio(uid: string, bio: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { bio, updatedAt: serverTimestamp() });
}

/** Salvează modificările din „Editează profilul” (doar câmpurile trimise; nu data nașterii sau genul). */
export async function updateProfileFields(uid: string, changes: ProfileChanges): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { ...changes, updatedAt: serverTimestamp() });
}

/** Scoate un tag învățat (din cardul „Învățate din evenimentele tale”). */
export async function setLearnedTags(uid: string, learnedTags: string[]): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { learnedTags, updatedAt: serverTimestamp() });
}

/** Șterge profilul (la ștergerea contului). */
export async function deleteProfile(uid: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'users', uid));
}

/** Înscrierile și scorurile tag-urilor salvate (null dacă nu există încă). */
export async function getSavedPreferences(uid: string): Promise<Partial<UserPreferences> | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    joinedEventIds: Array.isArray(d.joinedEventIds) ? d.joinedEventIds : undefined,
    tagScores: d.tagScores && typeof d.tagScores === 'object' ? d.tagScores : undefined,
  };
}

/** Salvează înscrierile la evenimente și scorurile tag-urilor (la fiecare „Înscrie-te” / „Anulează”). */
export async function savePreferences(uid: string, prefs: UserPreferences): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), {
    joinedEventIds: prefs.joinedEventIds,
    tagScores: prefs.tagScores,
    updatedAt: serverTimestamp(),
  });
}
