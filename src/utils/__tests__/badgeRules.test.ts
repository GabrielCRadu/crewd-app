import { describe, expect, it } from '@jest/globals';

import type { BadgeVotes, EventBadgeProposals } from '../../types/badges';
import type { CategoryId, Event } from '../../types/events';
import {
  BADGE_THRESHOLD,
  MAX_BADGES_PER_PERSON,
  addVote,
  autoBadgeProgress,
  canPropose,
  distinctVoters,
  earnedAutoBadges,
  earnedVotedBadges,
  myProposalsFor,
  toggleProposal,
} from '../badgeRules';

/** Un eveniment la care ai fost; pentru badge-urile automate contează doar categoria. */
function attended(category: CategoryId, id: string = category): Event {
  return { id, category } as Event;
}

const ids = (badges: { id: string }[]) => badges.map((b) => b.id);

describe('badge-urile votate', () => {
  it('pragul este de 3 persoane', () => {
    expect(BADGE_THRESHOLD).toBe(3);
  });

  it('un badge nu apare cu mai puțin de 3 persoane', () => {
    expect(earnedVotedBadges({})).toEqual([]);
    expect(earnedVotedBadges({ funny: ['a'] })).toEqual([]);
    expect(earnedVotedBadges({ funny: ['a', 'b'] })).toEqual([]);
  });

  it('apare când 3 persoane diferite l-au propus', () => {
    expect(ids(earnedVotedBadges({ funny: ['a', 'b', 'c'] }))).toEqual(['funny']);
    expect(ids(earnedVotedBadges({ funny: ['a', 'b', 'c', 'd'] }))).toEqual(['funny']);
  });

  it('aceeași persoană contează o singură dată', () => {
    const votes: BadgeVotes = { funny: ['a', 'a', 'a', 'b'] };
    expect(distinctVoters(votes, 'funny')).toBe(2);
    expect(earnedVotedBadges(votes)).toEqual([]);
  });

  it('voturile pentru badge-uri diferite nu se adună', () => {
    expect(earnedVotedBadges({ funny: ['a', 'b'], warm: ['c', 'd'] })).toEqual([]);
  });

  it('întoarce doar badge-urile câștigate, în ordinea din listă', () => {
    const votes: BadgeVotes = { guide: ['a', 'b', 'c'], funny: ['a', 'b', 'c'], chill: ['a', 'b'] };
    expect(ids(earnedVotedBadges(votes))).toEqual(['funny', 'guide']);
  });

  it('addVote adaugă un votant nou și nu dublează unul existent', () => {
    const two: BadgeVotes = { funny: ['a', 'b'] };
    const three = addVote(two, 'funny', 'me');
    expect(ids(earnedVotedBadges(three))).toEqual(['funny']);
    expect(two.funny).toEqual(['a', 'b']);
    expect(addVote(three, 'funny', 'me')).toBe(three);
    expect(addVote({}, 'warm', 'me')).toEqual({ warm: ['me'] });
  });
});

describe('propunerile tale', () => {
  it('toggleProposal bifează și debifează', () => {
    expect(toggleProposal([], 'funny')).toEqual(['funny']);
    expect(toggleProposal(['funny', 'warm'], 'funny')).toEqual(['warm']);
  });

  it('nu poți propune mai mult de 3 badge-uri unei persoane la un eveniment', () => {
    expect(MAX_BADGES_PER_PERSON).toBe(3);
    const full = toggleProposal(toggleProposal(toggleProposal([], 'funny'), 'warm'), 'chill');
    expect(full).toHaveLength(3);
    expect(toggleProposal(full, 'soul')).toBe(full);
    expect(canPropose(full, 'soul')).toBe(false);
    // Cele deja bifate se pot scoate oricând.
    expect(canPropose(full, 'warm')).toBe(true);
    expect(toggleProposal(full, 'warm')).toEqual(['funny', 'chill']);
  });

  it('același badge propus la mai multe evenimente contează o singură dată', () => {
    const proposals: Record<string, EventBadgeProposals> = {
      e1: { p1: ['funny', 'warm'] },
      e2: { p1: ['funny'], p2: ['chill'] },
    };
    expect(myProposalsFor(proposals, 'p1')).toEqual(['funny', 'warm']);
    expect(myProposalsFor(proposals, 'p2')).toEqual(['chill']);
    expect(myProposalsFor(proposals, 'p9')).toEqual([]);
  });
});

describe('badge-urile automate', () => {
  it('fără evenimente nu ai niciun badge', () => {
    expect(earnedAutoBadges([])).toEqual([]);
    expect(autoBadgeProgress([]).every((p) => p.current === 0 && !p.earned)).toBe(true);
  });

  it('Festivalier vine după 5 concerte', () => {
    const four = Array.from({ length: 4 }, (_, i) => attended('muzica', `m${i}`));
    expect(ids(earnedAutoBadges(four))).not.toContain('festivalier');
    const progress = autoBadgeProgress(four).find((p) => p.badge.id === 'festivalier')!;
    expect(progress).toMatchObject({ current: 4, target: 5, earned: false });

    const five = [...four, attended('muzica', 'm4')];
    expect(ids(earnedAutoBadges(five))).toContain('festivalier');
  });

  it('Explorator numără categorii diferite, nu evenimente', () => {
    const sameCategory = [attended('sport', 's1'), attended('sport', 's2'), attended('sport', 's3')];
    expect(ids(earnedAutoBadges(sameCategory))).not.toContain('explorer');

    const three = [attended('muzica'), attended('social'), attended('sport')];
    expect(ids(earnedAutoBadges(three))).toEqual(['explorer']);
  });

  it('progresul nu depășește ținta', () => {
    const many = Array.from({ length: 12 }, (_, i) => attended('teatru', `t${i}`));
    const theatre = autoBadgeProgress(many).find((p) => p.badge.id === 'theatre')!;
    expect(theatre).toMatchObject({ current: 3, target: 3, earned: true });
    expect(ids(earnedAutoBadges(many))).toEqual(['theatre', 'regular']);
  });
});
