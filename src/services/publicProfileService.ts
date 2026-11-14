import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';
import type { PublicProfile } from '../types/user';
import { parsePublicProfile } from '../utils/publicProfile';

/*
 * Profilul public: profiles/{uid} (spec 2026-11-14-profil-membru-tema-design.md).
 * Orice utilizator logat poate citi un profil anume (nu poate lista colecția); scrie doar proprietarul.
 * Îl ține la zi AuthContext, din profilul privat users/{uid}.
 */

function requireDb() {
  if (!db) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return db;
}

/** Profilul public al cuiva, sau null dacă nu are încă unul. */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(requireDb(), 'profiles', uid));
  return snap.exists() ? parsePublicProfile(uid, snap.data()) : null;
}

/** Scrie (înlocuiește) profilul tău public. */
export async function savePublicProfile(p: PublicProfile): Promise<void> {
  await setDoc(doc(requireDb(), 'profiles', p.uid), {
    name: p.name,
    age: p.age,
    city: p.city,
    bio: p.bio,
    photoUrl: p.photoUrl,
    username: p.username,
    tags: p.tags,
    updatedAt: serverTimestamp(),
  });
}

/** Șterge profilul tău public (la ștergerea contului). */
export async function deletePublicProfile(uid: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'profiles', uid));
}
