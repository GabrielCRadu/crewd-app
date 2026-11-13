import { useSyncExternalStore } from 'react';

import { getMyRatings, subscribeToRatings } from '../services/ratingsService';
import type { MyRatings } from '../services/ratingsService';

/** Evaluările tale. Componenta se re-desenează automat după „Trimite”. */
export function useRatings(): MyRatings {
  return useSyncExternalStore(subscribeToRatings, getMyRatings);
}
