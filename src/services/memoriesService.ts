import { INITIAL_MEMORIES } from '../data/mockMemories';
import { ME_ID } from '../data/mockRatings';
import type { Event } from '../types/events';
import type { Memory, MemoryVisibility } from '../types/memories';

/*
 * Amintirile: poze de la evenimentele la care ai fost, afișate pe profil.
 *
 * Acum totul stă în memorie (se resetează când repornești aplicația), ca evaluările și badge-urile.
 * Pozele tale rămân fișiere pe dispozitiv; ale celorlalți sunt mock (data/mockMemories.ts).
 * Cu Firebase, pozele ar merge în Storage, iar fiecare amintire într-un document cu `visibility`,
 * cu reguli care lasă amintirile „doar prieteni” să fie citite numai de prieteni.
 *
 * Ecranele folosesc doar funcțiile exportate de aici și hook-ul din hooks/useMemories.ts.
 */

let memories: Memory[] = INITIAL_MEMORIES;

const listeners = new Set<() => void>();

function setMemories(next: Memory[]) {
  memories = next;
  listeners.forEach((listener) => listener());
}

export function getMemories(): Memory[] {
  return memories;
}

/** Abonare la schimbări. Returnează o funcție de dezabonare. */
export function subscribeToMemories(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Amintirile unei persoane (toate; ce vede fiecare se hotărăște cu utils/memoryRules.ts). */
export function memoriesOf(all: Memory[], ownerId: string): Memory[] {
  return all.filter((m) => m.ownerId === ownerId);
}

/** Amintirile tale. */
export function myMemories(all: Memory[]): Memory[] {
  return memoriesOf(all, ME_ID);
}

/** E amintirea ta? (doar pe ale tale le poți șterge sau schimba) */
export function isMyMemory(memory: Memory): boolean {
  return memory.ownerId === ME_ID;
}

let nextId = 1;

/** Adaugă o poză de la un eveniment la care ai fost. */
export async function addMemory(event: Event, photoUri: string, visibility: MemoryVisibility): Promise<Memory> {
  const memory: Memory = {
    id: `mine-${nextId++}`,
    ownerId: ME_ID,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.startsAt,
    photoUri,
    visibility,
    createdAt: new Date(),
  };
  setMemories([...memories, memory]);
  return memory;
}

/** Șterge o amintire de-a ta. */
export async function deleteMemory(memoryId: string): Promise<void> {
  setMemories(memories.filter((m) => !(m.id === memoryId && isMyMemory(m))));
}

/** Schimbă cine poate vedea o amintire de-a ta. */
export async function setMemoryVisibility(memoryId: string, visibility: MemoryVisibility): Promise<void> {
  setMemories(memories.map((m) => (m.id === memoryId && isMyMemory(m) ? { ...m, visibility } : m)));
}
