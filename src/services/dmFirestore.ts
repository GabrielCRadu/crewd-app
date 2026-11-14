import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { pairId } from '../utils/friendshipRules';

/*
 * Mesajele directe între conturi reale, doar între prieteni (Firestore):
 * - dms/{pairId}: { users: [a, b] sortate, lastText, lastBy, lastAt } — o conversație pe pereche;
 * - dms/{pairId}/messages/{id}: { authorUid, text?, eventId?, createdAt }.
 * Conversația se creează la primul mesaj (același id pentru aceeași pereche, deci se redeschide aceeași).
 * Ecranele nu folosesc acest fișier direct, ci directMessagesService.ts.
 */

export interface RemoteDm {
  id: string;
  authorUid: string;
  text?: string;
  eventId?: string;
  sentAt: Date;
  /** Ascuns de moderarea automată. */
  removed?: { category: string };
}

export interface RemoteThread {
  other: string;
  last: RemoteDm;
}

function requireDb() {
  if (!db) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return db;
}

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : new Date());

/** Conversațiile tale (cu ultimul mesaj), live. */
export function subscribeToMyDms(me: string, onChange: (threads: RemoteThread[]) => void): () => void {
  return onSnapshot(
    query(collection(requireDb(), 'dms'), where('users', 'array-contains', me)),
    (snap) =>
      onChange(
        snap.docs
          .map((d): RemoteThread | null => {
            const data = d.data();
            const users = (data.users ?? []) as string[];
            const other = users[0] === me ? users[1] : users[0];
            if (!other || typeof data.lastBy !== 'string') return null;
            return {
              other,
              last: {
                id: `last-${d.id}`,
                authorUid: data.lastBy,
                text: typeof data.lastText === 'string' && data.lastText ? data.lastText : undefined,
                eventId: typeof data.lastEventId === 'string' ? data.lastEventId : undefined,
                sentAt: toDate(data.lastAt),
              },
            };
          })
          .filter((t): t is RemoteThread => t !== null),
      ),
    (e) => console.warn('Nu am putut încărca conversațiile:', e),
  );
}

/** Mesajele unei conversații (ultimele 200), de la cel mai vechi la cel mai nou, live. */
export function subscribeToDmMessages(me: string, other: string, onChange: (messages: RemoteDm[]) => void): () => void {
  return onSnapshot(
    query(collection(requireDb(), 'dms', pairId(me, other), 'messages'), orderBy('createdAt', 'desc'), limit(200)),
    (snap) =>
      onChange(
        snap.docs
          .map((d): RemoteDm => {
            const data = d.data({ serverTimestamps: 'estimate' });
            return {
              id: d.id,
              authorUid: String(data.authorUid ?? ''),
              text: typeof data.text === 'string' ? data.text : undefined,
              eventId: typeof data.eventId === 'string' ? data.eventId : undefined,
              sentAt: toDate(data.createdAt),
              ...(data.removed && typeof data.removed.category === 'string'
                ? { removed: { category: String(data.removed.category) } }
                : {}),
            };
          })
          .reverse(),
      ),
    (e) => console.warn('Nu am putut încărca mesajele:', e),
  );
}

/** Trimite un mesaj (text și/sau eveniment); creează conversația dacă nu există. */
export async function sendDm(me: string, other: string, message: { text?: string; eventId?: string }): Promise<void> {
  const database = requireDb();
  const id = pairId(me, other);
  const batch = writeBatch(database);
  batch.set(
    doc(database, 'dms', id),
    {
      users: me < other ? [me, other] : [other, me],
      lastText: message.text ?? '',
      lastEventId: message.eventId ?? null,
      lastBy: me,
      lastAt: serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(doc(collection(database, 'dms', id, 'messages')), {
    authorUid: me,
    ...(message.text ? { text: message.text } : {}),
    ...(message.eventId ? { eventId: message.eventId } : {}),
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

/** La ștergerea contului: mesajele tale și conversațiile în care ai fost (ce e deja șters nu contează). */
export async function deleteMyDms(me: string): Promise<void> {
  const database = requireDb();
  const threads = await getDocs(query(collection(database, 'dms'), where('users', 'array-contains', me)));
  for (const thread of threads.docs) {
    const mine = await getDocs(query(collection(thread.ref, 'messages'), where('authorUid', '==', me)));
    const refs = [...mine.docs.map((d) => d.ref), thread.ref];
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(database);
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
  }
}
