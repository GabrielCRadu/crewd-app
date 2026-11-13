import { AUTO_BADGES, VOTED_BADGES } from '../data/badges';
import type {
  AutoBadgeInfo,
  AutoBadgeProgress,
  BadgeVotes,
  EventBadgeProposals,
  VotedBadgeId,
  VotedBadgeInfo,
} from '../types/badges';
import type { Event } from '../types/events';

/*
 * Regulile badge-urilor (logică pură, testată în __tests__/badgeRules.test.ts).
 *
 * Votate: un badge apare pe profil abia când BADGE_THRESHOLD persoane DIFERITE l-au propus.
 * Aceeași persoană contează o singură dată, oricâte evenimente ați avea împreună.
 * Automate: se câștigă din evenimentele la care ai fost (AUTO_BADGES din data/badges.ts).
 */

/** Câte persoane diferite trebuie să propună același badge ca să apară pe profil. */
export const BADGE_THRESHOLD = 3;

/** Câte badge-uri poți propune unei persoane la un eveniment. */
export const MAX_BADGES_PER_PERSON = 3;

/** Câte persoane diferite au propus un badge. */
export function distinctVoters(votes: BadgeVotes, badgeId: VotedBadgeId): number {
  return new Set(votes[badgeId] ?? []).size;
}

/** Badge-urile votate care au atins pragul, în ordinea din VOTED_BADGES. */
export function earnedVotedBadges(votes: BadgeVotes, threshold = BADGE_THRESHOLD): VotedBadgeInfo[] {
  return VOTED_BADGES.filter((badge) => distinctVoters(votes, badge.id) >= threshold);
}

/** Adaugă votul unei persoane la un badge (o listă nouă; același votant nu se adaugă de două ori). */
export function addVote(votes: BadgeVotes, badgeId: VotedBadgeId, voterId: string): BadgeVotes {
  const current = votes[badgeId] ?? [];
  if (current.includes(voterId)) return votes;
  return { ...votes, [badgeId]: [...current, voterId] };
}

/**
 * Bifează sau debifează un badge în propunerea ta pentru o persoană.
 * Peste MAX_BADGES_PER_PERSON nu se mai adaugă nimic (lista rămâne neschimbată).
 */
export function toggleProposal(current: VotedBadgeId[], badgeId: VotedBadgeId): VotedBadgeId[] {
  if (current.includes(badgeId)) return current.filter((id) => id !== badgeId);
  if (current.length >= MAX_BADGES_PER_PERSON) return current;
  return [...current, badgeId];
}

/** Mai poți bifa acest badge? (cele deja bifate rămân mereu apăsabile, ca să le poți scoate) */
export function canPropose(current: VotedBadgeId[], badgeId: VotedBadgeId): boolean {
  return current.includes(badgeId) || current.length < MAX_BADGES_PER_PERSON;
}

/** Badge-urile pe care le-ai propus tu unei persoane, la toate evenimentele (fără dubluri). */
export function myProposalsFor(proposals: Record<string, EventBadgeProposals>, personId: string): VotedBadgeId[] {
  const all = Object.values(proposals).flatMap((eventProposals) => eventProposals[personId] ?? []);
  return [...new Set(all)];
}

/** Câte dintre evenimentele la care ai fost se numără pentru un badge automat. */
function countFor(badge: AutoBadgeInfo, attended: Event[]): number {
  const { rule } = badge;
  if (rule.kind === 'category') return attended.filter((e) => e.category === rule.category).length;
  if (rule.kind === 'categories') return new Set(attended.map((e) => e.category)).size;
  return attended.length;
}

/** Progresul la fiecare badge automat, din evenimentele la care ai fost (terminate). */
export function autoBadgeProgress(attended: Event[]): AutoBadgeProgress[] {
  return AUTO_BADGES.map((badge) => {
    const target = badge.rule.count;
    const current = Math.min(countFor(badge, attended), target);
    return { badge, current, target, earned: current >= target };
  });
}

/** Badge-urile automate deja câștigate. */
export function earnedAutoBadges(attended: Event[]): AutoBadgeInfo[] {
  return autoBadgeProgress(attended)
    .filter((p) => p.earned)
    .map((p) => p.badge);
}
