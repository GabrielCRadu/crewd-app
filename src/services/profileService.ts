import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';
import type { ProfileDraft, UserProfile } from '../types/user';

/*
 * Profilul utilizatorului în Firestore: users/{uid}.
 * Regulile permit fiecăruia să-și citească și să-și scrie doar propriul document (firestore.rules).
 */

function requireDb() {
  if (!db) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return db;
}

/** Profilul utilizatorului, sau null dacă nu a terminat încă onboarding-ul. */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid,
    name: d.name ?? '',
    age: d.age ?? 0,
    city: d.city ?? '',
    gender: d.gender ?? 'other',
    bio: d.bio ?? '',
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
  const profile: UserProfile = { uid, ...draft, bio: '', learnedTags: [] };
  const { uid: _uid, ...data } = profile;
  await setDoc(doc(requireDb(), 'users', uid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return profile;
}

/** Salvează „Despre mine”. */
export async function setBio(uid: string, bio: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { bio, updatedAt: serverTimestamp() });
}

/** Scoate un tag învățat (din cardul „Învățate din evenimentele tale”). */
export async function setLearnedTags(uid: string, learnedTags: string[]): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { learnedTags, updatedAt: serverTimestamp() });
}
