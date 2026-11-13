/*
 * Conversațiile directe, doar între tine și un prieten (ex. când îi trimiți un eveniment).
 *
 * Acum totul stă în memorie (se resetează când repornești aplicația), cu un răspuns automat
 * de la prieten după ce îi trimiți un eveniment, ca să se vadă conversația la demo.
 * Cu Firestore: directChats/{uidA_uidB}/messages, citite cu onSnapshot; regulile lasă doar
 * cele două persoane să citească și să scrie. Ecranele folosesc doar funcțiile de aici.
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
}

/** personId → mesajele, de la cel mai vechi la cel mai nou. */
export type DirectThreads = Record<string, DirectMessage[]>;

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

/** Start: o conversație cu Maria, ca lista să nu fie goală. */
let threads: DirectThreads = {
  p1: [
    { id: 'd1', fromMe: false, text: 'Mergi diseară la Open Mic?', sentAt: minutesAgo(95) },
    { id: 'd2', fromMe: true, text: 'Cred că da! Tu?', sentAt: minutesAgo(90) },
    { id: 'd3', fromMe: false, text: 'Sigur, ne vedem la intrare', sentAt: minutesAgo(88) },
  ],
};

const listeners = new Set<() => void>();
let counter = 0;

function addMessage(personId: string, message: Omit<DirectMessage, 'id' | 'sentAt'>) {
  counter += 1;
  const full: DirectMessage = { ...message, id: `local-${Date.now()}-${counter}`, sentAt: new Date() };
  threads = { ...threads, [personId]: [...(threads[personId] ?? []), full] };
  listeners.forEach((listener) => listener());
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
  if (trimmed) addMessage(personId, { fromMe: true, text: trimmed });
}

/** DEMO: răspunsurile prietenului la un eveniment trimis. */
const DEMO_REPLIES = ['Arată super! Hai că vin și eu', 'Ooo, nu știam de asta. Mergem?', 'Sună bine, mă înscriu acum'];
const DEMO_REPLY_DELAY_MS = 2500;

/** Trimite un eveniment unui prieten (apare ca un card cu afiș în conversație). */
export async function sendEventToFriend(personId: string, eventId: string, note?: string): Promise<void> {
  addMessage(personId, { fromMe: true, eventId, text: note?.trim() || undefined });
  // DEMO: prietenul răspunde după câteva secunde.
  const reply = DEMO_REPLIES[counter % DEMO_REPLIES.length]!;
  setTimeout(() => addMessage(personId, { fromMe: false, text: reply }), DEMO_REPLY_DELAY_MS);
}
