import { useSyncExternalStore } from 'react';

import { getPreferences, subscribeToPreferences } from '../services/preferencesService';
import type { UserPreferences } from '../types/events';

/**
 * Preferințele curente. Componenta se re-desenează automat când se schimbă
 * (de ex. după „Mă înscriu”), pe orice ecran ar fi.
 */
export function usePreferences(): UserPreferences {
  return useSyncExternalStore(subscribeToPreferences, getPreferences);
}
