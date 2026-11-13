import type { CrewGroup, GroupStatus } from '../types/groups';
import { groupStatus } from './groupRules';

/*
 * Potrivirea cu un grupuleț și ordinea în lista evenimentului
 * (docs/superpowers/specs/2026-11-13-grupulete-design.md → „Potrivirea”).
 */

/** Tag-urile mele care apar la grupuleț sau la membrii lui, fără dubluri, în ordinea mea. */
export function commonTags(g: CrewGroup, myTags: string[]): string[] {
  const theirs = new Set<string>(g.tags);
  for (const m of Object.values(g.members)) m.tags.forEach((t) => theirs.add(t));
  return myTags.filter((t, i) => theirs.has(t) && myTags.indexOf(t) === i);
}

/** Scorul de potrivire: tag-urile comune contează cel mai mult, apoi apropierea de mijlocul intervalului de vârstă. */
export function matchScore(g: CrewGroup, myTags: string[], myAge: number): number {
  const middle = (g.minAge + g.maxAge) / 2;
  return commonTags(g, myTags).length * 10 - Math.abs(myAge - middle);
}

/** Ordinea categoriilor în listă (grupurile expirate nu apar). */
const STATUS_ORDER: Record<Exclude<GroupStatus, 'expired'>, number> = { formed: 0, forming: 1, full: 2, closed: 3 };

/** Lista de grupulețe în ordinea afișării: formate, în formare, complete, închise; în fiecare, după potrivire. */
export function sortGroupsForUser(groups: CrewGroup[], myTags: string[], myAge: number, now: Date): CrewGroup[] {
  return groups
    .map((g) => ({ g, status: groupStatus(g, now), score: matchScore(g, myTags, myAge) }))
    .filter((x): x is { g: CrewGroup; status: Exclude<GroupStatus, 'expired'>; score: number } => x.status !== 'expired')
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.score - a.score)
    .map((x) => x.g);
}
