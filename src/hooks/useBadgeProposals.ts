import { useSyncExternalStore } from 'react';

import { getMyBadgeProposals, subscribeToBadgeProposals } from '../services/badgesService';
import type { MyBadgeProposals } from '../services/badgesService';

/** Badge-urile propuse de tine. Componenta se re-desenează automat după „Trimite evaluarea”. */
export function useBadgeProposals(): MyBadgeProposals {
  return useSyncExternalStore(subscribeToBadgeProposals, getMyBadgeProposals);
}
