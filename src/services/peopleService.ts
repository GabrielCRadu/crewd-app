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
