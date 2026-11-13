import { AUTO_BADGES } from '../data/badges';
import { INITIAL_AUTO_BADGES, INITIAL_BADGE_VOTES } from '../data/mockBadges';
import { ME_ID } from '../data/mockRatings';
import type { AutoBadgeInfo, BadgeVotes, EventBadgeProposals, VotedBadgeInfo } from '../types/badges';
import { addVote, earnedVotedBadges, myProposalsFor } from '../utils/badgeRules';

/*
 * Badge-urile de pe profil.
 *
 * Votate: după un eveniment, propui badge-uri oamenilor cu care ai fost (ecranul „Cum a fost?”).
 * Un badge apare pe profil abia când 3 persoane diferite l-au propus (utils/badgeRules.ts).
 * De aici ies doar badge-urile câștigate: nu se vede câte voturi are unul sub prag și nici cine a votat.
 *
 * Acum totul stă în memorie (se resetează când repornești aplicația), ca evaluările din ratingsService.
 * Cu Firestore, fiecare propunere ar fi un document pe care îl poate citi doar cel care l-a scris,
 * iar numărarea persoanelor diferite trebuie făcută pe server, nu în aplicație.
 *
 * Ecranele folosesc doar funcțiile exportate de aici și hook-ul din hooks/useBadgeProposals.ts.
 */

/** Propunerile tale: eventId → (personId → badge-uri). */
export type MyBadgeProposals = Record<string, EventBadgeProposals>;

let myProposals: MyBadgeProposals = {};

const listeners = new Set<() => void>();

export function getMyBadgeProposals(): MyBadgeProposals {
  return myProposals;
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToBadgeProposals(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Salvează (sau înlocuiește) badge-urile propuse de tine la un eveniment. */
export async function saveEventBadgeProposals(eventId: string, proposals: EventBadgeProposals): Promise<void> {
  myProposals = { ...myProposals, [eventId]: proposals };
  listeners.forEach((listener) => listener());
}

/** Voturile unei persoane: ce au propus alții, plus ce ai propus tu (o singură dată, oricâte evenimente). */
function votesFor(proposals: MyBadgeProposals, personId: string): BadgeVotes {
  let votes: BadgeVotes = INITIAL_BADGE_VOTES[personId] ?? {};
  for (const badgeId of myProposalsFor(proposals, personId)) votes = addVote(votes, badgeId, ME_ID);
  return votes;
}

/** Badge-urile votate care apar pe profilul unei persoane (au atins pragul). */
export function getVotedBadges(proposals: MyBadgeProposals, personId: string): VotedBadgeInfo[] {
  return earnedVotedBadges(votesFor(proposals, personId));
}

/** Badge-urile votate de pe profilul tău. */
export function getMyVotedBadges(): VotedBadgeInfo[] {
  return earnedVotedBadges(INITIAL_BADGE_VOTES[ME_ID] ?? {});
}

/**
 * Badge-urile automate ale altei persoane.
 * Mock: o listă fixă. Ale tale se calculează din istoric, cu autoBadgeProgress (utils/badgeRules.ts).
 */
export function getAutoBadges(personId: string): AutoBadgeInfo[] {
  const ids = INITIAL_AUTO_BADGES[personId] ?? [];
  return AUTO_BADGES.filter((badge) => ids.includes(badge.id));
}
