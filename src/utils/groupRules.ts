import type { CrewGroup, GroupStatus, JoinContext, MemberSummary, ProposalDraft } from '../types/groups';
import type { UserProfile } from '../types/user';
import { ageFromBirthDate } from './birthDate';
import { allProfileTags } from './profileTags';
import { tr } from '../i18n';

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
/** Marjă peste limita de 30 min: serverul cere strict mai mult de 30 min, la ora lui. */
const PROPOSE_MARGIN_MS = MIN;
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

/** Chat-ul se deschide doar pentru grupulețele care s-au format (au ajuns cândva la 3 membri). */
export function canOpenChat(g: Pick<CrewGroup, 'formedAt'>): boolean {
  return g.formedAt !== null;
}

/**
 * Vede grupulețul în lista evenimentului?
 * - grupurile fără membri nu apar;
 * - cele expirate și cele închise rămân vizibile doar membrilor (ca să afle ce s-a întâmplat);
 * - restul, dacă vârsta se încadrează.
 */
export function isVisibleTo(g: CrewGroup, viewer: { uid: string; age: number }, now: Date): boolean {
  if (g.memberUids.length === 0) return false;
  const status = groupStatus(g, now);
  if (status === 'expired' || status === 'closed') return g.memberUids.includes(viewer.uid);
  return viewer.age >= g.minAge && viewer.age <= g.maxAge;
}

/** De ce nu poate intra (mesaj pentru utilizator), sau null dacă poate. */
export function joinBlockReason(g: CrewGroup, ctx: JoinContext, now: Date): string | null {
  if (ctx.currentGroupId === g.id) return tr('Ești deja în acest grup.');
  if (g.memberUids.length === 0) return tr('Grupul nu mai există.');
  if (!ctx.isRegistered) return tr('Înscrie-te întâi la eveniment.');
  if (ctx.isBlocked) return tr('Nu poți intra în grupuri o perioadă, din cauza raportărilor.');
  const status = groupStatus(g, now);
  if (status === 'closed') return tr('Întâlnirea a început deja.');
  if (status === 'full') return tr('Grupul s-a umplut.');
  if (status === 'expired') return tr('Grupul nu s-a format la timp.');
  if (ctx.age < g.minAge || ctx.age > g.maxAge) return tr('Nu te încadrezi în intervalul de vârstă al grupului.');
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
  if (!vibe) errors.vibe = tr('Scrie o propoziție despre vibe-ul grupului.');
  else if (vibe.length > VIBE_MAX_LENGTH) errors.vibe = tr('Maxim {VIBE_MAX_LENGTH} de caractere.', { VIBE_MAX_LENGTH: VIBE_MAX_LENGTH });

  if (!d.meetupPlace.trim()) errors.meetupPlace = tr('Scrie unde vă vedeți.');

  if (!Number.isInteger(d.maxSize) || d.maxSize < MIN_GROUP_SIZE || d.maxSize > MAX_GROUP_SIZE) {
    errors.maxSize = tr('Alege între {MIN_GROUP_SIZE} și {MAX_GROUP_SIZE} persoane.', { MIN_GROUP_SIZE: MIN_GROUP_SIZE, MAX_GROUP_SIZE: MAX_GROUP_SIZE });
  }

  if (d.minAge < MIN_MEMBER_AGE) errors.minAge = tr('Vârsta minimă e {MIN_MEMBER_AGE} ani.', { MIN_MEMBER_AGE: MIN_MEMBER_AGE });
  else if (d.maxAge < d.minAge) errors.maxAge = tr('Vârsta maximă trebuie să fie cel puțin cea minimă.');
  else if (proposerAge < d.minAge || proposerAge > d.maxAge) {
    errors.minAge = tr('Intervalul trebuie să includă și vârsta ta.');
  }

  if (d.meetupAt.getTime() > eventStartsAt.getTime()) {
    errors.meetupAt = tr('Întâlnirea trebuie să fie înainte de începutul evenimentului.');
  } else if (d.meetupAt.getTime() - now.getTime() <= PROPOSE_CUTOFF_MS + PROPOSE_MARGIN_MS) {
    errors.meetupAt = tr('Întâlnirea e prea aproape: alege cu cel puțin 30 de minute înainte.');
  }

  return errors;
}

/** Vârsta din profil: din data nașterii, sau din `age` la profilurile vechi. */
export function profileAge(p: { birthDate: string | null; age: number }, now: Date): number {
  return p.birthDate ? ageFromBirthDate(p.birthDate, now) : p.age;
}

/**
 * Ce copiem din profil în `members[uid]` al grupului (vizibil celorlalți membri).
 * `photo` e null când nu ai miniatură: Firestore refuză valorile undefined.
 */
export function memberSummary(me: UserProfile, now: Date): MemberSummary {
  return { name: me.name, age: profileAge(me, now), tags: allProfileTags(me), photo: me.photoThumb ?? null };
}

/**
 * Lista celorlalte grupuri de la eveniment e deschisă de la început? Nu, cât timp ești într-un grup care
 * se formează sau s-a format (ca să nu sari dintr-un grup în altul); da, dacă n-ai grup sau al tău nu s-a format.
 */
export function otherGroupsOpenByDefault(myGroup: CrewGroup | null, now: Date): boolean {
  if (!myGroup) return true;
  const status = groupStatus(myGroup, now);
  return status === 'expired' || status === 'closed';
}
