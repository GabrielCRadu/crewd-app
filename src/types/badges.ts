import type { CategoryId, IconName } from './events';

/**
 * Badge-urile votate: le propun oamenii cu care ai fost în grup, după eveniment.
 * Apar pe profil abia când destule persoane diferite au propus același badge (vezi utils/badgeRules.ts).
 */
export type VotedBadgeId =
  | 'funny'
  | 'warm'
  | 'listener'
  | 'energy'
  | 'chill'
  | 'soul'
  | 'inclusive'
  | 'icebreaker'
  | 'organizer'
  | 'reliable'
  | 'dancer'
  | 'guide';

/** Badge-urile automate: se câștigă din evenimentele la care ai fost, fără voturi. */
export type AutoBadgeId = 'festivalier' | 'party' | 'theatre' | 'explorer' | 'regular';

export interface VotedBadgeInfo {
  id: VotedBadgeId;
  label: string;
  icon: IconName;
}

/** Ce se numără pentru un badge automat. */
export type AutoBadgeRule =
  /** Evenimente dintr-o categorie. */
  | { kind: 'category'; category: CategoryId; count: number }
  /** Categorii diferite la care ai fost. */
  | { kind: 'categories'; count: number }
  /** Evenimente în total. */
  | { kind: 'events'; count: number };

export interface AutoBadgeInfo {
  id: AutoBadgeId;
  label: string;
  icon: IconName;
  rule: AutoBadgeRule;
  /** Ce se numără, pentru textul de progres (ex. „concerte” → „2 din 5 concerte”). */
  unit: string;
}

/** Cine a propus fiecare badge unei persoane: badge → id-urile celor care l-au propus. */
export type BadgeVotes = Partial<Record<VotedBadgeId, string[]>>;

/** Propunerile tale de la un eveniment: personId → badge-urile propuse. */
export type EventBadgeProposals = Record<string, VotedBadgeId[]>;

/** Cât mai ai până la un badge automat. */
export interface AutoBadgeProgress {
  badge: AutoBadgeInfo;
  current: number;
  target: number;
  earned: boolean;
}
