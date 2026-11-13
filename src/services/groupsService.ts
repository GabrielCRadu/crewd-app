import {
  Timestamp,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type { DocumentData, DocumentSnapshot, Transaction } from 'firebase/firestore';

import { allProfileTags } from '../context/AuthContext';
import { placeMockEvents } from '../data/mockEvents';
import { ME_ID } from '../data/mockRatings';
import { PEOPLE } from '../data/mockSocial';
import { db } from '../lib/firebase';
import type { CrewGroup, MemberSummary, ProposalDraft } from '../types/groups';
import type { UserProfile } from '../types/user';
import { MIN_FORM_MEMBERS, REPORT_BLOCK_THRESHOLD, joinBlockReason, profileAge } from '../utils/groupRules';
import { getPreferences, isJoined } from './preferencesService';
import { getMyRatings, getReputation } from './ratingsService';

/*
 * Grupulețele de la evenimente (docs/superpowers/specs/2026-11-13-grupulete-design.md).
 *
 * - Cu Firebase: events/{eventId}/groups/{groupId} + users/{uid}.groupByEvent (eventId → groupId).
 *   Intrarea, ieșirea și propunerea sunt tranzacții care scriu ambele documente deodată;
 *   firestore.rules verifică aceleași limite pe server.
 * - Fără Firebase: un depozit în memorie, cu câteva grupulețe demo pentru evenimentele mock.
 *
 * Ecranele folosesc doar funcțiile de aici și hook-urile useEventGroups / useMyGroups.
 */

/** Eroare cu mesaj pentru utilizator (motivul pentru care nu poate intra / propune). */
export class GroupActionError extends Error {}

const NETWORK_MESSAGE = 'Nu am putut salva. Verifică conexiunea la internet și încearcă din nou.';
const DENIED_MESSAGE = 'Nu s-a putut: între timp s-a schimbat ceva (locuri, termen sau înscriere). Reîncarcă și încearcă din nou.';

function memberSummary(me: UserProfile, now: Date): MemberSummary {
  return { name: me.name, age: profileAge(me, now), tags: allProfileTags(me) };
}

function isBlocked(): boolean {
  return getReputation(getMyRatings(), ME_ID).reportsCount >= REPORT_BLOCK_THRESHOLD;
}

/** Transformă erorile Firestore în mesajul generic; pe ale noastre le lasă cum sunt. */
async function guard<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (e) {
    if (e instanceof GroupActionError) throw e;
    console.warn('Grupulețe: eroare Firestore', e);
    // Serverul a refuzat (regulile): ceva s-a schimbat între timp (locuri, termen, înscriere), nu e o problemă de rețea.
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
    if (code === 'permission-denied') throw new GroupActionError(DENIED_MESSAGE);
    throw new GroupActionError(NETWORK_MESSAGE);
  }
}

// ---------------------------------------------------------------------------------------------
// Grupul meu la fiecare eveniment (cache sincron, actualizat de subscribeToMyGroups)

let myGroupByEvent: Record<string, string> = {};

/** Grupulețul în care sunt la evenimentul dat (din ultima stare cunoscută), sau null. */
export function getMyGroupIdForEvent(eventId: string): string | null {
  return myGroupByEvent[eventId] ?? null;
}

// ---------------------------------------------------------------------------------------------
// Firestore

function fromDoc(snap: DocumentSnapshot<DocumentData>): CrewGroup | null {
  const d = snap.data({ serverTimestamps: 'estimate' });
  if (!d || !(d.meetupAt instanceof Timestamp)) return null;
  return {
    id: snap.id,
    eventId: d.eventId,
    proposerUid: d.proposerUid,
    meetupAt: d.meetupAt.toDate(),
    meetupPlace: d.meetupPlace ?? '',
    minAge: d.minAge,
    maxAge: d.maxAge,
    maxSize: d.maxSize,
    vibe: d.vibe ?? '',
    tags: Array.isArray(d.tags) ? d.tags : [],
    memberUids: Array.isArray(d.memberUids) ? d.memberUids : [],
    members: d.members ?? {},
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    formedAt: d.formedAt instanceof Timestamp ? d.formedAt.toDate() : null,
  };
}

const groupRef = (eventId: string, groupId: string) => doc(db!, 'events', eventId, 'groups', groupId);
const userRef = (uid: string) => doc(db!, 'users', uid);

/** Scoate utilizatorul dintr-un grupuleț, în cadrul unei tranzacții (după ce s-au făcut toate citirile). */
function removeMember(tx: Transaction, g: CrewGroup, uid: string) {
  tx.update(groupRef(g.eventId, g.id), {
    memberUids: g.memberUids.filter((u) => u !== uid),
    [`members.${uid}`]: deleteField(),
  });
}

async function firestoreJoin(eventId: string, groupId: string, me: UserProfile): Promise<void> {
  await runTransaction(db!, async (tx) => {
    const now = new Date();
    const userSnap = await tx.get(userRef(me.uid));
    const currentGroupId: string | null = userSnap.data()?.groupByEvent?.[eventId] ?? null;
    const target = fromDoc(await tx.get(groupRef(eventId, groupId)));
    if (!target) throw new GroupActionError('Grupulețul nu mai există.');
    const previous =
      currentGroupId && currentGroupId !== groupId ? fromDoc(await tx.get(groupRef(eventId, currentGroupId))) : null;

    const reason = joinBlockReason(
      target,
      { age: profileAge(me, now), isRegistered: isJoined(getPreferences(), eventId), currentGroupId, isBlocked: isBlocked() },
      now,
    );
    if (reason) throw new GroupActionError(reason);

    if (previous) removeMember(tx, previous, me.uid);
    const memberUids = [...target.memberUids, me.uid];
    tx.update(groupRef(eventId, groupId), {
      memberUids,
      [`members.${me.uid}`]: memberSummary(me, now),
      ...(target.formedAt === null && memberUids.length >= MIN_FORM_MEMBERS ? { formedAt: serverTimestamp() } : {}),
    });
    tx.update(userRef(me.uid), { [`groupByEvent.${eventId}`]: groupId });
  });
}

async function firestorePropose(eventId: string, draft: ProposalDraft, tags: string[], me: UserProfile): Promise<string> {
  const newRef = doc(collection(db!, 'events', eventId, 'groups'));
  await runTransaction(db!, async (tx) => {
    const now = new Date();
    const userSnap = await tx.get(userRef(me.uid));
    const currentGroupId: string | null = userSnap.data()?.groupByEvent?.[eventId] ?? null;
    const previous = currentGroupId ? fromDoc(await tx.get(groupRef(eventId, currentGroupId))) : null;

    if (!isJoined(getPreferences(), eventId)) throw new GroupActionError('Înscrie-te întâi la eveniment.');
    if (isBlocked()) throw new GroupActionError('Nu poți propune grupulețe o perioadă, din cauza raportărilor.');

    if (previous) removeMember(tx, previous, me.uid);
    tx.set(newRef, {
      eventId,
      proposerUid: me.uid,
      meetupAt: Timestamp.fromDate(draft.meetupAt),
      meetupPlace: draft.meetupPlace.trim(),
      minAge: draft.minAge,
      maxAge: draft.maxAge,
      maxSize: draft.maxSize,
      vibe: draft.vibe.trim(),
      tags,
      memberUids: [me.uid],
      members: { [me.uid]: memberSummary(me, now) },
      createdAt: serverTimestamp(),
      formedAt: null,
    });
    tx.update(userRef(me.uid), { [`groupByEvent.${eventId}`]: newRef.id });
  });
  return newRef.id;
}

async function firestoreLeave(eventId: string, groupId: string, uid: string): Promise<void> {
  await runTransaction(db!, async (tx) => {
    const g = fromDoc(await tx.get(groupRef(eventId, groupId)));
    if (g && g.memberUids.includes(uid)) removeMember(tx, g, uid);
    tx.update(userRef(uid), { [`groupByEvent.${eventId}`]: deleteField() });
  });
}

// ---------------------------------------------------------------------------------------------
// Mock (fără Firebase): depozit în memorie

const DEMO_UID = 'demo';
const mockGroups = new Map<string, CrewGroup[]>();
const mockListeners = new Set<() => void>();
let mockSeq = 0;

function mockNotify() {
  mockListeners.forEach((l) => l());
}

/** La prima cerere pentru un eveniment mock viitor, îi creăm 2 grupulețe demo (unul format, unul în formare). */
function mockGroupsFor(eventId: string): CrewGroup[] {
  if (!mockGroups.has(eventId)) {
    const event = placeMockEvents({ latitude: 0, longitude: 0 }).find((e) => e.id === eventId);
    const seeded: CrewGroup[] = [];
    if (event && event.startsAt.getTime() - Date.now() > 3 * 3_600_000) {
      const meetupAt = new Date(event.startsAt.getTime() - 15 * 60_000);
      const createdAt = new Date(Date.now() - 24 * 3_600_000);
      const summary = (p: (typeof PEOPLE)[number]): MemberSummary => ({ name: p.name, age: p.age, tags: p.tags });
      const formedMembers = PEOPLE.slice(0, 4);
      const formingMembers = PEOPLE.slice(2, 4);
      seeded.push(
        {
          id: `${eventId}-demo-a`,
          eventId,
          proposerUid: formedMembers[0]!.id,
          meetupAt,
          meetupPlace: 'în fața intrării',
          minAge: 19,
          maxAge: 27,
          maxSize: 6,
          vibe: 'Venim pentru muzică, apoi o bere la o terasă.',
          tags: event.tags,
          memberUids: formedMembers.map((p) => p.id),
          members: Object.fromEntries(formedMembers.map((p) => [p.id, summary(p)])),
          createdAt,
          formedAt: createdAt,
        },
        {
          id: `${eventId}-demo-b`,
          eventId,
          proposerUid: formingMembers[0]!.id,
          meetupAt,
          meetupPlace: 'la bar',
          minAge: 20,
          maxAge: 30,
          maxSize: 8,
          vibe: 'Prima dată la un astfel de eveniment, căutăm oameni relaxați.',
          tags: event.tags,
          memberUids: formingMembers.map((p) => p.id),
          members: Object.fromEntries(formingMembers.map((p) => [p.id, summary(p)])),
          createdAt,
          formedAt: null,
        },
      );
    }
    mockGroups.set(eventId, seeded);
  }
  return mockGroups.get(eventId)!;
}

function mockUpdate(eventId: string, groupId: string, change: (g: CrewGroup) => CrewGroup) {
  mockGroups.set(
    eventId,
    mockGroupsFor(eventId).map((g) => (g.id === groupId ? change(g) : g)),
  );
}

function mockRemove(eventId: string, groupId: string, uid: string) {
  mockUpdate(eventId, groupId, (g) => {
    const members = { ...g.members };
    delete members[uid];
    return { ...g, memberUids: g.memberUids.filter((u) => u !== uid), members };
  });
}

function mockJoin(eventId: string, groupId: string, me: UserProfile) {
  const now = new Date();
  const target = mockGroupsFor(eventId).find((g) => g.id === groupId);
  if (!target) throw new GroupActionError('Grupulețul nu mai există.');
  const currentGroupId = myGroupByEvent[eventId] ?? null;
  const reason = joinBlockReason(
    target,
    { age: profileAge(me, now), isRegistered: isJoined(getPreferences(), eventId), currentGroupId, isBlocked: isBlocked() },
    now,
  );
  if (reason) throw new GroupActionError(reason);
  if (currentGroupId) mockRemove(eventId, currentGroupId, me.uid);
  mockUpdate(eventId, groupId, (g) => {
    const memberUids = [...g.memberUids, me.uid];
    return {
      ...g,
      memberUids,
      members: { ...g.members, [me.uid]: memberSummary(me, now) },
      formedAt: g.formedAt ?? (memberUids.length >= MIN_FORM_MEMBERS ? now : null),
    };
  });
  myGroupByEvent = { ...myGroupByEvent, [eventId]: groupId };
  mockNotify();
}

// ---------------------------------------------------------------------------------------------
// API public

/** Grupulețele unui eveniment, în timp real. Returnează funcția de dezabonare. */
export function subscribeToEventGroups(
  eventId: string,
  cb: (groups: CrewGroup[]) => void,
  onError: (e: Error) => void,
): () => void {
  if (!db) {
    const emit = () => cb(mockGroupsFor(eventId));
    mockListeners.add(emit);
    emit();
    return () => {
      mockListeners.delete(emit);
    };
  }
  return onSnapshot(
    collection(db, 'events', eventId, 'groups'),
    (snap) => cb(snap.docs.map(fromDoc).filter((g): g is CrewGroup => g !== null)),
    onError,
  );
}

/**
 * Grupulețele mele, în timp real: ascultă users/{uid}.groupByEvent și apoi fiecare grupuleț de acolo
 * (fără o interogare pe toate grupurile, care ar cere un index creat manual în consolă).
 */
export function subscribeToMyGroups(
  uid: string,
  cb: (groups: CrewGroup[]) => void,
  onError: (e: Error) => void,
): () => void {
  if (!db) {
    const emit = () => {
      cb(
        Object.entries(myGroupByEvent)
          .map(([eventId, groupId]) => mockGroupsFor(eventId).find((g) => g.id === groupId))
          .filter((g): g is CrewGroup => g !== undefined),
      );
    };
    mockListeners.add(emit);
    emit();
    return () => {
      mockListeners.delete(emit);
    };
  }

  const groupUnsubs = new Map<string, () => void>();
  const latest = new Map<string, CrewGroup>();
  const emit = () => cb([...latest.values()]);

  const userUnsub = onSnapshot(
    userRef(uid),
    (snap) => {
      const byEvent: Record<string, string> = snap.data()?.groupByEvent ?? {};
      myGroupByEvent = byEvent;
      const wanted = new Set(Object.entries(byEvent).map(([eventId, groupId]) => `${eventId}/${groupId}`));
      for (const [key, unsub] of groupUnsubs) {
        if (!wanted.has(key)) {
          unsub();
          groupUnsubs.delete(key);
          latest.delete(key);
        }
      }
      for (const key of wanted) {
        if (groupUnsubs.has(key)) continue;
        const [eventId, groupId] = key.split('/') as [string, string];
        groupUnsubs.set(
          key,
          onSnapshot(
            groupRef(eventId, groupId),
            (gSnap) => {
              const g = fromDoc(gSnap);
              if (g && g.memberUids.includes(uid)) latest.set(key, g);
              else latest.delete(key);
              emit();
            },
            onError,
          ),
        );
      }
      emit();
    },
    onError,
  );

  return () => {
    userUnsub();
    groupUnsubs.forEach((unsub) => unsub());
    groupUnsubs.clear();
  };
}

/** Propune un grupuleț nou (devii primul membru; ieși din grupulețul vechi de la eveniment, dacă erai). */
export async function proposeGroup(eventId: string, draft: ProposalDraft, tags: string[], me: UserProfile): Promise<string> {
  if (!db) {
    if (!isJoined(getPreferences(), eventId)) throw new GroupActionError('Înscrie-te întâi la eveniment.');
    const current = myGroupByEvent[eventId];
    if (current) mockRemove(eventId, current, me.uid);
    const id = `${eventId}-mine-${++mockSeq}`;
    const now = new Date();
    mockGroups.set(eventId, [
      ...mockGroupsFor(eventId),
      {
        id,
        eventId,
        proposerUid: me.uid,
        ...draft,
        meetupPlace: draft.meetupPlace.trim(),
        vibe: draft.vibe.trim(),
        tags,
        memberUids: [me.uid],
        members: { [me.uid]: memberSummary(me, now) },
        createdAt: now,
        formedAt: null,
      },
    ]);
    myGroupByEvent = { ...myGroupByEvent, [eventId]: id };
    mockNotify();
    return id;
  }
  return guard(() => firestorePropose(eventId, draft, tags, me));
}

/** Intră într-un grupuleț (și ieși din cel vechi de la același eveniment, dacă erai). */
export async function joinGroup(eventId: string, groupId: string, me: UserProfile): Promise<void> {
  if (!db) {
    mockJoin(eventId, groupId, me);
    return;
  }
  await guard(() => firestoreJoin(eventId, groupId, me));
}

/** Ieși dintr-un grupuleț. */
export async function leaveGroup(eventId: string, groupId: string, uid: string): Promise<void> {
  if (!db) {
    mockRemove(eventId, groupId, uid);
    const next = { ...myGroupByEvent };
    delete next[eventId];
    myGroupByEvent = next;
    mockNotify();
    return;
  }
  await guard(() => firestoreLeave(eventId, groupId, uid));
}

/** Ieși din grupulețul de la eveniment, dacă ești într-unul (ex. când îți anulezi înscrierea). */
export async function leaveGroupForEvent(eventId: string, uid: string): Promise<void> {
  if (!db) {
    const current = myGroupByEvent[eventId];
    if (current) await leaveGroup(eventId, current, uid);
    return;
  }
  await guard(async () => {
    const snap = await getDoc(userRef(uid));
    const groupId: string | undefined = snap.data()?.groupByEvent?.[eventId];
    if (groupId) await firestoreLeave(eventId, groupId, uid);
  });
}

/** Ieși din toate grupulețele (la ștergerea contului), ca să nu rămâi membru-fantomă. */
export async function leaveAllGroups(uid: string): Promise<void> {
  if (!db) {
    for (const [eventId, groupId] of Object.entries(myGroupByEvent)) await leaveGroup(eventId, groupId, uid);
    return;
  }
  await guard(async () => {
    const snap = await getDoc(userRef(uid));
    const byEvent: Record<string, string> = snap.data()?.groupByEvent ?? {};
    for (const [eventId, groupId] of Object.entries(byEvent)) await firestoreLeave(eventId, groupId, uid);
  });
}

/** Uid-ul folosit fără Firebase (profilul demo). */
export const MOCK_UID = DEMO_UID;
