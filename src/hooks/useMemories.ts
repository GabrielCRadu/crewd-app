import { useSyncExternalStore } from 'react';

import { getMemories, subscribeToMemories } from '../services/memoriesService';
import type { Memory } from '../types/memories';

/** Toate amintirile. Componenta se re-desenează când adaugi, ștergi sau schimbi una. */
export function useMemories(): Memory[] {
  return useSyncExternalStore(subscribeToMemories, getMemories);
}
