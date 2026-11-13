import { useSyncExternalStore } from 'react';

import { getDirectThreads, subscribeToDirectThreads } from '../services/directMessagesService';
import type { DirectThreads } from '../services/directMessagesService';

/** Conversațiile directe. Componenta se re-desenează la orice mesaj nou. */
export function useDirectThreads(): DirectThreads {
  return useSyncExternalStore(subscribeToDirectThreads, getDirectThreads);
}
