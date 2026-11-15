import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';

/*
 * La ce evenimente merge fiecare cont real: going/{uid} = { eventIds, updatedAt }.
 * Înscrierile complete (users/{uid}) sunt private; lista asta o pot citi doar prietenii tăi (firestore.rules),
 * ca să apari la „Prieteni care participă”. O scrie aplicația la fiecare înscriere / anulare și la login.
 */

function requireDb() {
  if (!db) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return db;
}

/** Publică lista evenimentelor tale (doar cele reale, din Firestore). */
export async function publishGoing(uid: string, eventIds: string[]): Promise<void> {
  await setDoc(doc(requireDb(), 'going', uid), { eventIds: eventIds.slice(0, 500), updatedAt: serverTimestamp() });
}

/** Evenimentele unui prieten; listă goală dacă n-a publicat încă sau nu ai voie (nu sunteți prieteni). */
export async function getGoing(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(requireDb(), 'going', uid));
    const ids: unknown = snap.data()?.eventIds;
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** La ștergerea contului. */
export async function deleteGoing(uid: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'going', uid));
}
