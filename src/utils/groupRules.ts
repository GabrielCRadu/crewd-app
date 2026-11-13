import type { CrewGroup, GroupStatus, JoinContext, ProposalDraft } from '../types/groups';
import { ageFromBirthDate } from './birthDate';

/*
 * Regulile grupulețelor, ca funcții pure (testate în __tests__/groupRules.test.ts).
 * Aceleași limite sunt verificate și în firestore.rules.
 * Valorile vin din docs/superpowers/specs/2026-11-13-grupulete-design.md.
 */

const MIN = 60_000;

/** Câți membri trebuie ca grupulețul să se formeze (și să se deschidă chat-ul). */
export const MIN_FORM_MEMBERS = 3;
export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 10;
export const DEFAULT_GROUP_SIZE = 6;
export const MIN_MEMBER_AGE = 18;
export const DEFAULT_AGE_SPREAD = 4;
export const DEFAULT_MEETUP_LEAD_MIN = 15;
export const DEFAULT_MEETUP_PLACE = 'în fața intrării';
export const VIBE_MAX_LENGTH = 120;
/** Termenul normal de formare: cu 2 ore înainte de întâlnire. */
export const FORMATION_LEAD_MS = 2 * 60 * MIN;
/** Termenul pentru grupulețele propuse după termenul normal: cu 30 de minute înainte. */
export const LATE_FORMATION_LEAD_MS = 30 * MIN;
/** Nu se mai pot propune grupulețe cu mai puțin de 30 de minute înainte de întâlnire. */
export const PROPOSE_CUTOFF_MS = 30 * MIN;
/** De la câte raportări confirmate nu mai poți intra în grupulețe (reputația e încă mock). */
export const REPORT_BLOCK_THRESHOLD = 2;

/** Până când trebuie să se strângă 3 membri. */
export function formationDeadline(g: Pick<CrewGroup, 'meetupAt' | 'createdAt'>): Date {
  const normal = g.meetupAt.getTime() - FORMATION_LEAD_MS;
  if (g.createdAt.getTime() <= normal) return new Date(normal);
  return new Date(g.meetupAt.getTime() - LATE_FORMATION_LEAD_MS);
}

export function groupStatus(g: CrewGroup, now: Date): GroupStatus {
  if (now.getTime() >= g.meetupAt.getTime()) return 'closed';
  if (g.memberUids.length >= g.maxSize) return 'full';
  if (g.formedAt) return 'formed';
  if (now.getTime() > formationDeadline(g).getTime()) return 'expired';
  return 'forming';
}

/** Vede grupulețul în lista evenimentului? Grupurile închise rămân vizibile doar membrilor. */
export function isVisibleTo(g: CrewGroup, viewer: { uid: string; age: number }, now: Date): boolean {
  const status = groupStatus(g, now);
  if (status === 'expired') return false;
  if (status === 'closed') return g.memberUids.includes(viewer.uid);
  return viewer.age >= g.minAge && viewer.age <= g.maxAge;
}

/** De ce nu poate intra (mesaj pentru utilizator), sau null dacă poate. */
export function joinBlockReason(g: CrewGroup, ctx: JoinContext, now: Date): string | null {
  if (ctx.currentGroupId === g.id) return 'Ești deja în acest grupuleț.';
  if (!ctx.isRegistered) return 'Înscrie-te întâi la eveniment.';
  if (ctx.isBlocked) return 'Nu poți intra în grupulețe o perioadă, din cauza raportărilor.';
  const status = groupStatus(g, now);
  if (status === 'closed') return 'Întâlnirea a început deja.';
  if (status === 'full') return 'Grupulețul s-a umplut.';
  if (status === 'expired') return 'Grupulețul nu s-a format la timp.';
  if (ctx.age < g.minAge || ctx.age > g.maxAge) return 'Nu te încadrezi în intervalul de vârstă al grupului.';
  return null;
}

/** Valorile precompletate ale formularului „Propune un grupuleț”. */
export function defaultProposal(eventStartsAt: Date, proposerAge: number): ProposalDraft {
  return {
    meetupAt: new Date(eventStartsAt.getTime() - DEFAULT_MEETUP_LEAD_MIN * MIN),
    meetupPlace: DEFAULT_MEETUP_PLACE,
    minAge: Math.max(MIN_MEMBER_AGE, proposerAge - DEFAULT_AGE_SPREAD),
    maxAge: proposerAge + DEFAULT_AGE_SPREAD,
    maxSize: DEFAULT_GROUP_SIZE,
    vibe: '',
  };
}

/** Erorile formularului, pe câmpuri (obiect gol = valid). */
export function proposalErrors(
  d: ProposalDraft,
  proposerAge: number,
  eventStartsAt: Date,
  now: Date,
): Partial<Record<keyof ProposalDraft, string>> {
  const errors: Partial<Record<keyof ProposalDraft, string>> = {};

  const vibe = d.vibe.trim();
  if (!vibe) errors.vibe = 'Scrie o propoziție despre vibe-ul grupului.';
  else if (vibe.length > VIBE_MAX_LENGTH) errors.vibe = `Maxim ${VIBE_MAX_LENGTH} de caractere.`;

  if (!d.meetupPlace.trim()) errors.meetupPlace = 'Scrie unde vă vedeți.';

  if (!Number.isInteger(d.maxSize) || d.maxSize < MIN_GROUP_SIZE || d.maxSize > MAX_GROUP_SIZE) {
    errors.maxSize = `Alege între ${MIN_GROUP_SIZE} și ${MAX_GROUP_SIZE} persoane.`;
  }

  if (d.minAge < MIN_MEMBER_AGE) errors.minAge = `Vârsta minimă e ${MIN_MEMBER_AGE} ani.`;
  else if (d.maxAge < d.minAge) errors.maxAge = 'Vârsta maximă trebuie să fie cel puțin cea minimă.';
  else if (proposerAge < d.minAge || proposerAge > d.maxAge) {
    errors.minAge = 'Intervalul trebuie să includă și vârsta ta.';
  }

  if (d.meetupAt.getTime() > eventStartsAt.getTime()) {
    errors.meetupAt = 'Întâlnirea trebuie să fie înainte de începutul evenimentului.';
  } else if (d.meetupAt.getTime() - now.getTime() < PROPOSE_CUTOFF_MS) {
    errors.meetupAt = 'Întâlnirea e prea aproape: alege cu cel puțin 30 de minute înainte.';
  }

  return errors;
}

/** Vârsta din profil: din data nașterii, sau din `age` la profilurile vechi. */
export function profileAge(p: { birthDate: string | null; age: number }, now: Date): number {
  return p.birthDate ? ageFromBirthDate(p.birthDate, now) : p.age;
}
