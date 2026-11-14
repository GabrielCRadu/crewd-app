/*
 * Grupulețele de la evenimente (docs/superpowers/specs/2026-11-13-grupulete-design.md).
 * În Firestore: events/{eventId}/groups/{groupId} (schema în docs/firebase.md).
 */

/** Ce se știe despre un membru, copiat în grupuleț la intrare (fără email, fără poză). */
export interface MemberSummary {
  name: string;
  age: number;
  tags: string[];
  /** Miniatura pozei de profil (data URI sau URL), sau null. Lipsește la intrările de dinainte de chat. */
  photo?: string | null;
  /** Username-ul unic (pentru profilul membrului), sau null. Lipsește la intrările mai vechi. */
  username?: string | null;
}

export interface CrewGroup {
  id: string;
  eventId: string;
  proposerUid: string;
  meetupAt: Date;
  meetupPlace: string;
  minAge: number;
  maxAge: number;
  /** Între 3 și 10, ales de cel care propune. */
  maxSize: number;
  /** O propoziție despre vibe-ul grupului. */
  vibe: string;
  tags: string[];
  memberUids: string[];
  members: Record<string, MemberSummary>;
  createdAt: Date;
  /** Când a ajuns prima dată la 3 membri; odată setat, grupul rămâne format. */
  formedAt: Date | null;
}

/**
 * - forming: sub 3 membri, încă se poate forma
 * - formed: format (are `formedAt`), mai are locuri
 * - full: plin (membri = maxSize)
 * - expired: nu s-a format până la termen
 * - closed: a trecut ora întâlnirii
 */
export type GroupStatus = 'forming' | 'formed' | 'full' | 'expired' | 'closed';

/** Formularul „Propune un grupuleț”. */
export interface ProposalDraft {
  meetupAt: Date;
  meetupPlace: string;
  minAge: number;
  maxAge: number;
  maxSize: number;
  vibe: string;
}

/** Ce trebuie știut despre cel care vrea să intre. */
export interface JoinContext {
  age: number;
  isRegistered: boolean;
  /** Grupulețul în care e deja la acest eveniment, dacă e. */
  currentGroupId: string | null;
  /** Blocat temporar din cauza raportărilor. */
  isBlocked: boolean;
}
