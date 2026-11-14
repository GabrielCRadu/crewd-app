import { tr } from '../i18n';
import { newIncomingRequests, realFriendsState } from '../utils/friendshipRules';
import {
  acceptFriendship,
  blockUser,
  deleteFriendship,
  requestFriendship,
  subscribeToMyFriendships,
  unblockUser,
} from './friendshipsFirestore';
import { getPerson } from './peopleService';

/*
 * Prieteniile: cereri trimise / primite, prieteni, persoane blocate.
 *
 * Două surse, combinate pentru ecrane (spec 2026-11-14-prieteni-amintiri-design.md):
 * - persoanele de test (PEOPLE): în memorie, ca până acum (se resetează când repornești aplicația);
 * - conturile reale: friendships/ și blocks/ din Firestore (friendshipsFirestore.ts), ascultate live
 *   între startFriendsSync (la login) și stopFriendsSync (la logout).
 * Ecranele folosesc doar funcțiile exportate de aici.
 */

/** Relația ta cu o persoană. */
export type FriendStatus = 'none' | 'outgoing' | 'incoming' | 'friends' | 'blocked';

/** personId → relația (lipsă = 'none'). */
export type FriendsState = Record<string, FriendStatus>;

/** Start: Maria, Andrei și Ioana sunt prieteni (ca pe hartă); Bianca ți-a trimis o cerere. */
let testState: FriendsState = { p1: 'friends', p2: 'friends', p3: 'friends', p5: 'incoming' };
/** Relațiile contului real logat (din Firestore, plus schimbările optimiste până vine snapshot-ul). */
let realState: FriendsState = {};
/** Ultimul snapshot primit (null până la primul), ca să anunțăm doar cererile noi. */
let lastSnapshot: FriendsState | null = null;
let me: string | null = null;
let stopSync: (() => void) | null = null;
let combined: FriendsState = testState;

const listeners = new Set<() => void>();

function changed() {
  combined = { ...realState, ...testState };
  listeners.forEach((listener) => listener());
}

function withStatus(s: FriendsState, personId: string, status: FriendStatus): FriendsState {
  const next = { ...s };
  if (status === 'none') delete next[personId];
  else next[personId] = status;
  return next;
}

/** Un cont real (nu o persoană de test), cu cineva logat. */
function isReal(personId: string): boolean {
  return me !== null && !getPerson(personId);
}

function setStatus(personId: string, status: FriendStatus) {
  if (isReal(personId)) realState = withStatus(realState, personId, status);
  else testState = withStatus(testState, personId, status);
  changed();
}

/**
 * Schimbă relația cu un cont real: întâi pe ecran, apoi în Firestore; dacă scrierea eșuează, revine.
 * Pentru persoanele de test schimbă doar starea din memorie.
 */
async function change(personId: string, status: FriendStatus, write: (me: string, other: string) => Promise<void>) {
  const uid = me;
  if (!uid || !isReal(personId)) {
    setStatus(personId, status);
    return;
  }
  const previous = statusOf(realState, personId);
  setStatus(personId, status);
  try {
    await write(uid, personId);
  } catch (e) {
    if (me === uid) setStatus(personId, previous);
    throw e;
  }
}

export function getFriendsState(): FriendsState {
  return combined;
}

/** Cererea n-a putut fi trimisă (rețea sau refuz). Mesajul e neutru: cine e blocat nu află. */
export class FriendRequestError extends Error {
  constructor() {
    super(tr('Nu am putut trimite cererea. Încearcă mai târziu.'));
  }
}

/** Pornește ascultarea relațiilor contului real (la login). */
export function startFriendsSync(uid: string): void {
  if (me === uid && stopSync) return;
  stopFriendsSync();
  me = uid;
  stopSync = subscribeToMyFriendships(uid, (docs, blockedUids) => {
    if (me !== uid) return;
    const next = realFriendsState(uid, docs, blockedUids);
    const fresh = newIncomingRequests(lastSnapshot, next);
    lastSnapshot = next;
    realState = next;
    changed();
    fresh.forEach((personId) => announce({ kind: 'request', personId }));
  });
}

/** Oprește ascultarea și uită relațiile contului real (la logout). */
export function stopFriendsSync(): void {
  stopSync?.();
  stopSync = null;
  me = null;
  realState = {};
  lastSnapshot = null;
  changed();
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToFriends(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function statusOf(friends: FriendsState, personId: string): FriendStatus {
  return friends[personId] ?? 'none';
}

/** Id-urile persoanelor cu o anumită relație. */
export function idsWithStatus(friends: FriendsState, status: FriendStatus): string[] {
  return Object.keys(friends).filter((id) => friends[id] === status);
}

/** Trimite o cerere; pentru un cont real, aruncă FriendRequestError dacă n-a mers. */
export async function sendFriendRequest(personId: string): Promise<void> {
  try {
    await change(personId, 'outgoing', requestFriendship);
  } catch (e) {
    console.warn('Nu am putut trimite cererea de prietenie:', e);
    throw new FriendRequestError();
  }
}

export async function cancelFriendRequest(personId: string): Promise<void> {
  await change(personId, 'none', deleteFriendship);
}

export async function acceptFriendRequest(personId: string): Promise<void> {
  await change(personId, 'friends', acceptFriendship);
}

export async function declineFriendRequest(personId: string): Promise<void> {
  await change(personId, 'none', deleteFriendship);
}

export async function removeFriend(personId: string): Promise<void> {
  await change(personId, 'none', deleteFriendship);
}

/** Blocarea șterge orice prietenie sau cerere; persoana nu te mai poate adăuga. */
export async function blockPerson(personId: string): Promise<void> {
  await change(personId, 'blocked', blockUser);
}

export async function unblockPerson(personId: string): Promise<void> {
  await change(personId, 'none', unblockUser);
}

// ---------- Noutăți (pentru notificarea din colțul ecranului) ----------

/**
 * Ce anunță notificarea din colț:
 * - request: cineva ți-a trimis o cerere de prietenie;
 * - match: „Vă potriviți”, v-ați dat unul altuia „Aș mai ieși” după un eveniment.
 */
export type FriendNotice = { kind: 'request' | 'match'; personId: string };

const noticeListeners = new Set<(notice: FriendNotice) => void>();

function announce(notice: FriendNotice) {
  noticeListeners.forEach((listener) => listener(notice));
}

/** Abonare la noutățile de prietenie care sosesc acum. Returnează o funcție de dezabonare. */
export function subscribeToFriendNotices(listener: (notice: FriendNotice) => void): () => void {
  noticeListeners.add(listener);
  return () => {
    noticeListeners.delete(listener);
  };
}

/**
 * „Vă potriviți”: și tu, și persoana v-ați dat „Aș mai ieși”. Nu se anunță dacă sunteți deja
 * prieteni sau dacă ai blocat-o. Cu Firestore, ambele telefoane ar primi notificarea.
 */
export function announceMatch(personId: string): void {
  const current = statusOf(combined, personId);
  if (current === 'friends' || current === 'blocked') return;
  announce({ kind: 'match', personId });
}

/** Acceptarea unei potriviri: deveniți prieteni direct (amândoi ați vrut). */
export async function acceptMatch(personId: string): Promise<void> {
  setStatus(personId, 'friends');
}

/**
 * Cineva ți-a trimis o cerere. Cu Firestore, asta ar veni dintr-un onSnapshot pe
 * friendships unde `requestedBy` e celălalt și statusul e „pending”.
 * Cererile de la persoane blocate sau deja prietene sunt ignorate.
 */
export function receiveFriendRequest(personId: string): void {
  const current = statusOf(combined, personId);
  if (current === 'blocked' || current === 'friends' || current === 'incoming') return;
  setStatus(personId, 'incoming');
  announce({ kind: 'request', personId });
}

/** DEMO: după cât timp de la pornire îți trimite Tudor o cerere, ca să se vadă notificarea. */
const DEMO_REQUEST_DELAY_MS = 8000;
let demoScheduled = false;

/** DEMO: programează o singură cerere de prietenie (de la Tudor), o dată pe pornire de aplicație. */
export function scheduleDemoFriendRequest(): void {
  if (demoScheduled) return;
  demoScheduled = true;
  setTimeout(() => receiveFriendRequest('p6'), DEMO_REQUEST_DELAY_MS);
}
