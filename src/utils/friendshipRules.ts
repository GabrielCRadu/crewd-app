import type { FriendsState } from '../services/friendsService';

/*
 * Logica prieteniilor reale (spec 2026-11-14-prieteni-amintiri-design.md), fără Firestore:
 * id-ul perechii, starea ta din documentele friendships/ și blocks/, cererile noi.
 */

/** Un document friendships/{pairId}. */
export type FriendshipDoc = {
  id: string;
  users: [string, string];
  status: 'pending' | 'friends';
  requestedBy: string;
};

/** Id-ul documentului unei perechi: uid-urile sortate, unite cu `_` (unul singur pentru fiecare pereche). */
export function pairId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/** Relațiile tale cu conturile reale: cererile după cine a cerut, prieteniile, blocările (care au prioritate). */
export function realFriendsState(me: string, friendships: FriendshipDoc[], blockedUids: string[]): FriendsState {
  const state: FriendsState = {};
  for (const f of friendships) {
    const other = f.users[0] === me ? f.users[1] : f.users[0];
    if (other === me) continue;
    state[other] = f.status === 'friends' ? 'friends' : f.requestedBy === me ? 'outgoing' : 'incoming';
  }
  for (const uid of blockedUids) state[uid] = 'blocked';
  return state;
}

/** Cererile primite apărute de la starea trecută; la primul snapshot (`prev` null) nu se anunță nimic. */
export function newIncomingRequests(prev: FriendsState | null, next: FriendsState): string[] {
  if (!prev) return [];
  return Object.keys(next).filter((id) => next[id] === 'incoming' && prev[id] !== 'incoming');
}

/** Prietenii tăi (conturi reale) de verificat pentru „în comun” cu `target`. */
export function mutualCandidates(friends: FriendsState, target: string, isReal: (id: string) => boolean): string[] {
  return Object.keys(friends).filter((id) => friends[id] === 'friends' && id !== target && isReal(id));
}
