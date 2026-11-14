import type { Memory, MemoryViewer } from '../types/memories';

/*
 * Regulile amintirilor (logică pură, testată în __tests__/memoryRules.test.ts):
 * cine vede ce și în ce ordine apar în grilă.
 */

/** Poate vedea amintirea? Proprietarul le vede pe toate; cele „doar prieteni”, doar prietenii. */
export function canSeeMemory(memory: Memory, viewer: MemoryViewer): boolean {
  return viewer.isOwner || memory.visibility === 'everyone' || viewer.isFriend;
}

/** Amintirile pe care le poate vedea cel care se uită. */
export function visibleMemories(memories: Memory[], viewer: MemoryViewer): Memory[] {
  return memories.filter((m) => canSeeMemory(m, viewer));
}

/** Câte amintiri îi sunt ascunse (sunt doar pentru prieteni). */
export function hiddenMemoriesCount(memories: Memory[], viewer: MemoryViewer): number {
  return memories.length - visibleMemories(memories, viewer).length;
}

/** Amintirea e de la un eveniment la care ați fost amândoi? */
export function isSharedMemory(memory: Memory, togetherEventIds: string[]): boolean {
  return togetherEventIds.includes(memory.eventId);
}

/**
 * Ordinea din grilă: întâi amintirile de la evenimentele la care ați fost împreună,
 * apoi cele mai recente evenimente; la același eveniment, poza adăugată ultima e prima.
 */
export function sortMemories(memories: Memory[], togetherEventIds: string[] = []): Memory[] {
  return [...memories].sort((a, b) => {
    const shared = Number(isSharedMemory(b, togetherEventIds)) - Number(isSharedMemory(a, togetherEventIds));
    if (shared !== 0) return shared;
    const byEvent = b.eventDate.getTime() - a.eventDate.getTime();
    if (byEvent !== 0) return byEvent;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
