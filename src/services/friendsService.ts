/*
 * Prieteniile: cereri trimise / primite, prieteni, persoane blocate.
 *
 * Acum totul stă în memorie (se resetează când repornești aplicația).
 * Cu Firestore, fiecare relație ar fi un document friendships/{uidA_uidB} cu { users, status, requestedBy },
 * iar regulile ar lăsa doar cele două persoane să-l citească și să-l schimbe.
 * Ecranele folosesc doar funcțiile exportate de aici.
 */

/** Relația ta cu o persoană. */
export type FriendStatus = 'none' | 'outgoing' | 'incoming' | 'friends' | 'blocked';

/** personId → relația (lipsă = 'none'). */
export type FriendsState = Record<string, FriendStatus>;

/** Start: Maria, Andrei și Ioana sunt prieteni (ca pe hartă); Bianca ți-a trimis o cerere. */
let state: FriendsState = { p1: 'friends', p2: 'friends', p3: 'friends', p5: 'incoming' };

const listeners = new Set<() => void>();

function setStatus(personId: string, status: FriendStatus) {
  const next = { ...state };
  if (status === 'none') delete next[personId];
  else next[personId] = status;
  state = next;
  listeners.forEach((listener) => listener());
}

export function getFriendsState(): FriendsState {
  return state;
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

export async function sendFriendRequest(personId: string): Promise<void> {
  setStatus(personId, 'outgoing');
}

export async function cancelFriendRequest(personId: string): Promise<void> {
  setStatus(personId, 'none');
}

export async function acceptFriendRequest(personId: string): Promise<void> {
  setStatus(personId, 'friends');
}

export async function declineFriendRequest(personId: string): Promise<void> {
  setStatus(personId, 'none');
}

export async function removeFriend(personId: string): Promise<void> {
  setStatus(personId, 'none');
}

/** Blocarea șterge orice prietenie sau cerere; persoana nu te mai poate adăuga. */
export async function blockPerson(personId: string): Promise<void> {
  setStatus(personId, 'blocked');
}

export async function unblockPerson(personId: string): Promise<void> {
  setStatus(personId, 'none');
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
  const current = statusOf(state, personId);
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
  const current = statusOf(state, personId);
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
