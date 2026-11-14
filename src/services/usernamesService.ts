import { deleteDoc, doc, getDoc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';

import { PEOPLE } from '../data/mockSocial';
import { db } from '../lib/firebase';
import { canonicalUsername, usernameError } from '../utils/usernameRules';

/*
 * Username-urile unice (docs/superpowers/specs/2026-11-14-username-parola-design.md).
 *
 * - Cu Firebase: usernames/{key}, cheia = forma canonică (`.` → `_`), cu fișa publică { username, uid, name, photoThumb };
 *   se scrie în aceeași tranzacție cu users/{uid}.username, iar firestore.rules refuză un nume deja luat.
 * - Fără Firebase: un depozit în memorie.
 * Username-urile persoanelor de test (PEOPLE) nu pot fi luate, ca linkurile lor să ducă mereu la profilul de test.
 */

export interface PublicCard {
  username: string;
  uid: string;
  name: string;
  photoThumb: string | null;
}

/** Username-ul a fost luat (între timp) de altcineva. */
export class UsernameTakenError extends Error {
  constructor() {
    super('Username-ul e deja luat.');
  }
}

export type InviteTarget = { kind: 'self' } | { kind: 'person'; personId: string } | { kind: 'public'; username: string };

const mockCards = new Map<string, PublicCard>();

function cardRef(username: string) {
  return doc(db!, 'usernames', canonicalUsername(username));
}

function isTestPersonUsername(username: string): boolean {
  const key = canonicalUsername(username);
  return PEOPLE.some((p) => p.username && canonicalUsername(p.username) === key);
}

/** Username-ul poate fi ales? (fals și pentru cele invalide, rezervate sau ale persoanelor de test) */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (usernameError(username) || isTestPersonUsername(username)) return false;
  if (!db) return !mockCards.has(canonicalUsername(username));
  return !(await getDoc(cardRef(username))).exists();
}

/** Fișa publică a unui username (din codul QR), sau null dacă nu există. */
export async function lookupUsername(username: string): Promise<PublicCard | null> {
  if (usernameError(username)) return null;
  if (!db) return mockCards.get(canonicalUsername(username)) ?? null;
  const snap = await getDoc(cardRef(username));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { username: d.username, uid: d.uid, name: d.name, photoThumb: d.photoThumb ?? null };
}

/**
 * Rezervă username-ul într-o tranzacție deschisă (folosită și la crearea profilului):
 * dacă e luat aruncă UsernameTakenError, altfel scrie fișa publică.
 */
export async function reserveUsernameInTransaction(
  tx: Transaction,
  uid: string,
  card: Omit<PublicCard, 'uid'>,
): Promise<void> {
  if (usernameError(card.username) || isTestPersonUsername(card.username)) throw new UsernameTakenError();
  const ref = cardRef(card.username);
  if ((await tx.get(ref)).exists()) throw new UsernameTakenError();
  tx.set(ref, { username: card.username, uid, name: card.name, photoThumb: card.photoThumb });
}

/** Cont existent fără username: îl alege acum (o singură dată). */
export async function claimUsername(uid: string, card: Omit<PublicCard, 'uid'>): Promise<void> {
  if (!db) {
    const key = canonicalUsername(card.username);
    if (usernameError(card.username) || isTestPersonUsername(card.username) || mockCards.has(key)) {
      throw new UsernameTakenError();
    }
    mockCards.set(key, { ...card, uid });
    return;
  }
  await runTransaction(db, async (tx) => {
    await reserveUsernameInTransaction(tx, uid, card);
    tx.update(doc(db!, 'users', uid), { username: card.username, updatedAt: serverTimestamp() });
  });
}

/** Ține fișa publică la zi când îți schimbi numele sau poza. */
export async function updatePublicCard(
  username: string,
  changes: Partial<Pick<PublicCard, 'name' | 'photoThumb'>>,
): Promise<void> {
  if (!db) {
    const key = canonicalUsername(username);
    const card = mockCards.get(key);
    if (card) mockCards.set(key, { ...card, ...changes });
    return;
  }
  await updateDoc(cardRef(username), changes);
}

/**
 * La ștergerea contului: username-ul se eliberează. Dacă fișa nu mai există sau nu e a ta
 * (ex. o ștergere de cont reluată după o eroare), nu face nimic, ca ștergerea să poată continua.
 */
export async function releaseUsername(username: string, uid: string): Promise<void> {
  if (!db) {
    const key = canonicalUsername(username);
    if (mockCards.get(key)?.uid === uid) mockCards.delete(key);
    return;
  }
  const snap = await getDoc(cardRef(username));
  if (!snap.exists() || snap.data().uid !== uid) return;
  await deleteDoc(cardRef(username));
}

/** Unde duce un link de invitație: profilul tău (ignorat), o persoană de test, sau fișa publică. */
export function resolveInviteTarget(username: string, myUsername: string | null): InviteTarget {
  if (myUsername && canonicalUsername(myUsername) === canonicalUsername(username)) return { kind: 'self' };
  const person = PEOPLE.find((p) => p.username && canonicalUsername(p.username) === canonicalUsername(username));
  if (person) return { kind: 'person', personId: person.id };
  return { kind: 'public', username };
}
