import { MOCK_FRIENDSHIPS } from '../data/mockFriendships';
import { PEOPLE } from '../data/mockSocial';
import type { Person } from '../types/social';

/*
 * Celelalte persoane din aplicație (mock: PEOPLE din mockSocial.ts).
 * Cu Firebase, profilurile users/{uid} sunt private, deci aici va veni un profil public
 * separat (ex. publicProfiles/{uid}: nume, vârstă, oraș, descriere, tag-uri).
 */

export function getPerson(personId: string): Person | undefined {
  return PEOPLE.find((p) => p.id === personId);
}

/** Persoana după prenume (în mock, mesajele de chat, prietenii de pe hartă și „merg și ei” au doar numele). */
export function findPersonByName(name: string): Person | undefined {
  return PEOPLE.find((p) => p.name === name);
}

/** Tag-urile pe care le aveți în comun, în ordinea din profilul persoanei. */
export function commonTags(person: Person, myTags: string[]): string[] {
  return person.tags.filter((t) => myTags.includes(t));
}

/**
 * Prietenii unei persoane (fără tine), ordonați după nume.
 * Mock: din MOCK_FRIENDSHIPS. Cu Firebase: din colecția de prietenii, doar cele vizibile.
 */
export function friendsOfPerson(personId: string): Person[] {
  const ids = MOCK_FRIENDSHIPS.flatMap(([a, b]) => (a === personId ? [b] : b === personId ? [a] : []));
  return ids
    .map(getPerson)
    .filter((p): p is Person => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Prietenii comuni: prietenii persoanei care sunt și prietenii tăi. */
export function mutualFriends(personId: string, myFriendIds: string[]): Person[] {
  return friendsOfPerson(personId).filter((p) => myFriendIds.includes(p.id));
}
