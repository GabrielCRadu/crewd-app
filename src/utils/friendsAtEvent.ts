import type { CrewGroup } from '../types/groups';
import type { Person } from '../types/social';

/*
 * „Prieteni care participă” din detaliile unui eveniment: prietenii tăi (doar prieteniile acceptate)
 * care s-au înscris la eveniment, cu grupul lor de acolo, dacă au intrat într-unul.
 * Funcție pură, ca să o putem testa.
 */

export interface FriendAtEvent {
  person: Person;
  /** Grupul prietenului la acest eveniment, sau null dacă n-a intrat în niciunul. */
  group: CrewGroup | null;
}

interface Input {
  /** Prietenii tăi acceptați (fără cereri în așteptare și fără persoane blocate). */
  friends: Person[];
  /** Numele celor înscriși la eveniment (lista evenimentului; cei care s-au retras nu mai apar aici). */
  goingNames: string[];
  /** Grupurile de la acest eveniment. */
  groups: CrewGroup[];
}

/**
 * Prietenii care merg: înscriși la eveniment sau membri ai unui grup de acolo.
 * Ordine: întâi cei dintr-un grup, apoi alfabetic.
 */
export function friendsAtEvent({ friends, goingNames, groups }: Input): FriendAtEvent[] {
  const going = new Set(goingNames.map((n) => n.trim().toLowerCase()));
  const result: FriendAtEvent[] = [];
  for (const person of friends) {
    const group = groups.find((g) => g.memberUids.includes(person.id)) ?? null;
    if (group || going.has(person.name.trim().toLowerCase())) result.push({ person, group });
  }
  return result.sort((a, b) => {
    if (!!a.group !== !!b.group) return a.group ? -1 : 1;
    return a.person.name.localeCompare(b.person.name, 'ro');
  });
}

/** Numele grupului, pentru „în grupul lui …”: grupurile n-au nume, așa că folosim cine l-a propus. */
export function groupOwnerName(group: CrewGroup): string | null {
  return group.members[group.proposerUid]?.name ?? null;
}
