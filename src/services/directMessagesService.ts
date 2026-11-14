import { getPerson } from './peopleService';
import { sendDm, subscribeToDmMessages, subscribeToMyDms } from './dmFirestore';
import type { RemoteDm } from './dmFirestore';

/*
 * Conversațiile directe, doar între tine și un prieten (ex. când îi trimiți un eveniment).
 *
 * Două surse, combinate pentru ecrane:
 * - persoanele de test: în memorie (se resetează când repornești aplicația), cu un răspuns automat
 *   după ce îi trimiți un eveniment, ca să se vadă conversația la demo;
 * - conturile reale: Firestore (dmFirestore.ts), între startDmSync (la login) și stopDmSync (la logout).
 *   Lista vine cu ultimul mesaj al fiecărei conversații; mesajele complete, cât e deschisă (openConversation).
 * Ecranele folosesc doar funcțiile de aici.
 */

export interface DirectMessage {
  id: string;
  /** true = trimis de tine. */
  fromMe: boolean;
  /** Textul mesajului (poate lipsi la un eveniment trimis fără comentariu). */
  text?: string;
  /** Evenimentul trimis, afișat ca un card cu afiș. */
  eventId?: string;
  sentAt: Date;
  /** Ascuns de moderarea automată (conturile reale). */
  removed?: { category: string };
}

/** personId → mesajele, de la cel mai vechi la cel mai nou. */
export type DirectThreads = Record<string, DirectMessage[]>;

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

/** Start: o conversație cu Maria, ca lista să nu fie goală. */
let testThreads: DirectThreads = {
  p1: [
    { id: 'd1', fromMe: false, text: 'Mergi diseară la Open Mic?', sentAt: minutesAgo(95) },
    { id: 'd2', fromMe: true, text: 'Cred că da! Tu?', sentAt: minutesAgo(90) },
    { id: 'd3', fromMe: false, text: 'Sigur, ne vedem la intrare', sentAt: minutesAgo(88) },
  ],
};

/** Conturile reale: ultimul mesaj din fiecare conversație (din listă). */
let realLast: DirectThreads = {};
/** Conturile reale: mesajele complete ale conversațiilor deschise acum. */
let realOpen: DirectThreads = {};
let me: string | null = null;
let stopList: (() => void) | null = null;
let threads: DirectThreads = testThreads;

const listeners = new Set<() => void>();
let counter = 0;

function changed() {
  // Contul real vede doar conversațiile reale; cele de test rămân în modul fără Firebase (audit).
  threads = me !== null ? { ...realLast, ...realOpen } : testThreads;
  listeners.forEach((listener) => listener());
}

function addMessage(personId: string, message: Omit<DirectMessage, 'id' | 'sentAt'>) {
  counter += 1;
  const full: DirectMessage = { ...message, id: `local-${Date.now()}-${counter}`, sentAt: new Date() };
  testThreads = { ...testThreads, [personId]: [...(testThreads[personId] ?? []), full] };
  changed();
}

/** Un cont real (nu o persoană de test), cu cineva logat. */
function isReal(personId: string): boolean {
  return me !== null && !getPerson(personId);
}

function fromRemote(m: RemoteDm, uid: string): DirectMessage {
  return {
    id: m.id,
    fromMe: m.authorUid === uid,
    text: m.text,
    eventId: m.eventId,
    sentAt: m.sentAt,
    ...(m.removed ? { removed: m.removed } : {}),
  };
}

/** Pornește lista conversațiilor contului real (la login). */
export function startDmSync(uid: string): void {
  if (me === uid && stopList) return;
  stopDmSync();
  me = uid;
  stopList = subscribeToMyDms(uid, (list) => {
    if (me !== uid) return;
    const next: DirectThreads = {};
    for (const t of list) next[t.other] = [fromRemote(t.last, uid)];
    realLast = next;
    changed();
  });
}

/** Oprește ascultarea și uită conversațiile contului real (la logout). */
export function stopDmSync(): void {
  stopList?.();
  stopList = null;
  me = null;
  realLast = {};
  realOpen = {};
  changed();
}

/**
 * Ascultă toate mesajele unei conversații cu un cont real, cât e deschisă pe ecran.
 * Returnează funcția de oprire (pentru persoanele de test nu face nimic).
 */
export function openConversation(personId: string): () => void {
  const uid = me;
  if (!uid || !isReal(personId)) return () => {};
  const stop = subscribeToDmMessages(uid, personId, (messages) => {
    if (me !== uid) return;
    realOpen = { ...realOpen, [personId]: messages.map((m) => fromRemote(m, uid)) };
    changed();
  });
  return () => {
    stop();
    const next = { ...realOpen };
    delete next[personId];
    realOpen = next;
    changed();
  };
}

export function getDirectThreads(): DirectThreads {
  return threads;
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToDirectThreads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Conversațiile, cea mai recentă prima (pentru lista din tab-ul Chat). */
export function sortedThreads(all: DirectThreads): { personId: string; last: DirectMessage }[] {
  return Object.entries(all)
    .filter(([, messages]) => messages.length > 0)
    .map(([personId, messages]) => ({ personId, last: messages[messages.length - 1]! }))
    .sort((a, b) => b.last.sentAt.getTime() - a.last.sentAt.getTime());
}

export async function sendDirectText(personId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (isReal(personId) && me) await sendDm(me, personId, { text: trimmed });
  else addMessage(personId, { fromMe: true, text: trimmed });
}

/** DEMO: răspunsurile prietenului la un eveniment trimis. */
const DEMO_REPLIES = ['Arată super! Hai că vin și eu', 'Ooo, nu știam de asta. Mergem?', 'Sună bine, mă înscriu acum'];
const DEMO_REPLY_DELAY_MS = 2500;

/** Trimite un eveniment unui prieten (apare ca un card cu afiș în conversație). */
export async function sendEventToFriend(personId: string, eventId: string, note?: string): Promise<void> {
  if (isReal(personId) && me) {
    await sendDm(me, personId, { eventId, text: note?.trim() || undefined });
    return;
  }
  addMessage(personId, { fromMe: true, eventId, text: note?.trim() || undefined });
  // DEMO: prietenul răspunde după câteva secunde.
  const reply = DEMO_REPLIES[counter % DEMO_REPLIES.length]!;
  setTimeout(() => addMessage(personId, { fromMe: false, text: reply }), DEMO_REPLY_DELAY_MS);
}
