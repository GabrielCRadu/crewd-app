import {
  Timestamp,
  addDoc,
  collection,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { PEOPLE } from '../data/mockSocial';
import { db } from '../lib/firebase';
import type { GroupMessage } from '../types/chat';
import { LEFT_GROUP_MESSAGE, normalizeMessageText } from '../utils/chatRules';

/*
 * Conversația unui grup (docs/superpowers/specs/2026-11-14-chat-grup-design.md).
 *
 * - Cu Firebase: events/{eventId}/groups/{groupId}/messages/{id}; firestore.rules lasă doar membrii
 *   grupului să citească și să scrie, iar un mesaj are exact câmpurile authorUid, authorName, text, createdAt.
 * - Fără Firebase: un depozit în memorie, cu câteva mesaje demo în grupurile mock formate (`…-demo-a`).
 *
 * Ecranele folosesc doar funcțiile de aici și hook-urile useGroupMessages / useLastMessage.
 */

/** Eroare cu mesaj pentru utilizator. */
export class ChatActionError extends Error {}

export { LEFT_GROUP_MESSAGE };

const NETWORK_MESSAGE = 'Verifică conexiunea la internet și încearcă din nou.';
const EMPTY_MESSAGE = 'Mesajul e gol sau prea lung.';

/** Câte mesaje (cele mai noi) încărcăm într-o conversație. */
const MESSAGES_LIMIT = 200;

/** Mesajul pentru utilizator, din orice eroare a chatului. */
export function chatErrorMessage(e: unknown): string {
  if (e instanceof ChatActionError) return e.message;
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code === 'permission-denied') return LEFT_GROUP_MESSAGE;
  return NETWORK_MESSAGE;
}

// ---------------------------------------------------------------------------------------------
// Firestore

function messagesCollection(eventId: string, groupId: string) {
  return collection(db!, 'events', eventId, 'groups', groupId, 'messages');
}

function fromDoc(snap: QueryDocumentSnapshot<DocumentData>): GroupMessage | null {
  // „estimate”: un mesaj abia trimis (încă fără ora serverului) are ora telefonului și rămâne la locul lui.
  const d = snap.data({ serverTimestamps: 'estimate' });
  if (typeof d.text !== 'string' || typeof d.authorUid !== 'string') return null;
  return {
    id: snap.id,
    authorUid: d.authorUid,
    authorName: typeof d.authorName === 'string' ? d.authorName : '',
    text: d.text,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
  };
}

// ---------------------------------------------------------------------------------------------
// În memorie (fără Firebase)

const mockMessages = new Map<string, GroupMessage[]>();
const mockListeners = new Set<() => void>();
let mockSeq = 0;

const DEMO_TEXTS = ['Salut! Abia aștept diseară.', 'Și eu! Ne vedem la locul stabilit?', 'Da, ajung cu 5 minute mai devreme.'];

function mockKey(eventId: string, groupId: string): string {
  return `${eventId}/${groupId}`;
}

/** Mesajele unui grup; grupurile demo formate (aceiași membri ca în groupsService) pornesc cu o mică conversație. */
function mockMessagesFor(eventId: string, groupId: string): GroupMessage[] {
  const key = mockKey(eventId, groupId);
  if (!mockMessages.has(key)) {
    const seeded: GroupMessage[] = groupId.endsWith('-demo-a')
      ? DEMO_TEXTS.map((text, i) => {
          const author = PEOPLE[i]!;
          return {
            id: `${groupId}-m${i + 1}`,
            authorUid: author.id,
            authorName: author.name,
            text,
            createdAt: new Date(Date.now() - (3 - i) * 3_600_000),
          };
        })
      : [];
    mockMessages.set(key, seeded);
  }
  return mockMessages.get(key)!;
}

function mockSubscribe(emit: () => void): () => void {
  mockListeners.add(emit);
  emit();
  return () => {
    mockListeners.delete(emit);
  };
}

// ---------------------------------------------------------------------------------------------
// API public

/** Mesajele unui grup (cele mai noi 200), în ordine cronologică și în timp real. Returnează dezabonarea. */
export function subscribeToGroupMessages(
  eventId: string,
  groupId: string,
  cb: (messages: GroupMessage[]) => void,
  onError: (e: Error) => void,
): () => void {
  if (!db) return mockSubscribe(() => cb(mockMessagesFor(eventId, groupId)));
  return onSnapshot(
    query(messagesCollection(eventId, groupId), orderBy('createdAt'), limitToLast(MESSAGES_LIMIT)),
    (snap) => cb(snap.docs.map(fromDoc).filter((m): m is GroupMessage => m !== null)),
    onError,
  );
}

/** Ultimul mesaj al unui grup (sau null), în timp real. Pentru lista de chat-uri. */
export function subscribeToLastMessage(
  eventId: string,
  groupId: string,
  cb: (message: GroupMessage | null) => void,
  onError: (e: Error) => void,
): () => void {
  if (!db) {
    return mockSubscribe(() => {
      const all = mockMessagesFor(eventId, groupId);
      cb(all[all.length - 1] ?? null);
    });
  }
  return onSnapshot(
    query(messagesCollection(eventId, groupId), orderBy('createdAt', 'desc'), limit(1)),
    (snap) => cb(snap.docs.length > 0 ? fromDoc(snap.docs[0]!) : null),
    onError,
  );
}

/** Trimite un mesaj în grup, semnat cu numele de acum al autorului. */
export async function sendGroupMessage(
  eventId: string,
  groupId: string,
  author: { uid: string; name: string },
  text: string,
): Promise<void> {
  const clean = normalizeMessageText(text);
  if (!clean) throw new ChatActionError(EMPTY_MESSAGE);

  if (!db) {
    const key = mockKey(eventId, groupId);
    mockSeq += 1;
    mockMessages.set(key, [
      ...mockMessagesFor(eventId, groupId),
      { id: `local-${mockSeq}`, authorUid: author.uid, authorName: author.name, text: clean, createdAt: new Date() },
    ]);
    mockListeners.forEach((l) => l());
    return;
  }

  // Exact aceste 4 câmpuri: firestore.rules refuză orice altceva.
  await addDoc(messagesCollection(eventId, groupId), {
    authorUid: author.uid,
    authorName: author.name,
    text: clean,
    createdAt: serverTimestamp(),
  });
}
