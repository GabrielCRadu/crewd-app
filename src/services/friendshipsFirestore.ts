import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { pairId } from '../utils/friendshipRules';
import type { FriendshipDoc } from '../utils/friendshipRules';

/*
 * Prieteniile conturilor reale în Firestore (spec 2026-11-14-prieteni-amintiri-design.md):
 * - friendships/{pairId}: { users: [a, b] sortate, status: 'pending' | 'friends', requestedBy, createdAt, updatedAt };
 * - blocks/{blocker_blocked}: { blocker, blocked, createdAt }, citit doar de cine a blocat.
 * Ecranele nu folosesc acest fișier direct, ci friendsService.ts.
 */

function requireDb() {
  if (!db) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return db;
}

function friendshipRef(a: string, b: string) {
  return doc(requireDb(), 'friendships', pairId(a, b));
}

function sorted(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Relațiile tale (prietenii și cereri) și pe cine ai blocat, live. Returnează funcția de oprire. */
export function subscribeToMyFriendships(
  me: string,
  onChange: (docs: FriendshipDoc[], blockedUids: string[]) => void,
): () => void {
  const database = requireDb();
  let friendships: FriendshipDoc[] | null = null;
  let blocked: string[] | null = null;
  const emit = () => {
    if (friendships && blocked) onChange(friendships, blocked);
  };
  const stopFriendships = onSnapshot(
    query(collection(database, 'friendships'), where('users', 'array-contains', me)),
    (snap) => {
      friendships = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          users: data.users as [string, string],
          status: data.status === 'friends' ? 'friends' : 'pending',
          requestedBy: String(data.requestedBy ?? ''),
        };
      });
      emit();
    },
    (e) => console.warn('Nu am putut încărca prieteniile:', e),
  );
  const stopBlocks = onSnapshot(
    query(collection(database, 'blocks'), where('blocker', '==', me)),
    (snap) => {
      blocked = snap.docs.map((d) => String(d.data().blocked ?? ''));
      emit();
    },
    (e) => console.warn('Nu am putut încărca blocările:', e),
  );
  return () => {
    stopFriendships();
    stopBlocks();
  };
}

/** Trimite o cerere de prietenie. */
export async function requestFriendship(me: string, other: string): Promise<void> {
  await setDoc(friendshipRef(me, other), {
    users: sorted(me, other),
    status: 'pending',
    requestedBy: me,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Acceptă cererea primită de la `other`. */
export async function acceptFriendship(me: string, other: string): Promise<void> {
  await updateDoc(friendshipRef(me, other), { status: 'friends', updatedAt: serverTimestamp() });
}

/** Refuz, anulare sau eliminare: șterge relația. */
export async function deleteFriendship(me: string, other: string): Promise<void> {
  await deleteDoc(friendshipRef(me, other));
}

/** Blochează: blocarea și ștergerea relației dintre voi, împreună. */
export async function blockUser(me: string, other: string): Promise<void> {
  const database = requireDb();
  const batch = writeBatch(database);
  batch.set(doc(database, 'blocks', `${me}_${other}`), { blocker: me, blocked: other, createdAt: serverTimestamp() });
  batch.delete(friendshipRef(me, other));
  await batch.commit();
}

export async function unblockUser(me: string, other: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'blocks', `${me}_${other}`));
}

/** Sunt `a` și `b` prieteni? (pentru „în comun”; refuzul regulilor sau lipsa documentului înseamnă „nu”) */
export async function isFriendshipVisible(a: string, b: string): Promise<boolean> {
  try {
    const snap = await getDoc(friendshipRef(a, b));
    return snap.exists() && snap.data().status === 'friends';
  } catch {
    return false;
  }
}

/** La ștergerea contului: toate relațiile și blocările tale (documentele deja șterse nu contează). */
export async function deleteMyFriendData(me: string): Promise<void> {
  const database = requireDb();
  const [friendships, blocks] = await Promise.all([
    getDocs(query(collection(database, 'friendships'), where('users', 'array-contains', me))),
    getDocs(query(collection(database, 'blocks'), where('blocker', '==', me))),
  ]);
  const refs = [...friendships.docs, ...blocks.docs].map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(database);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}
