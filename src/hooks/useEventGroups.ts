import { useEffect, useState } from 'react';

import { subscribeToEventGroups } from '../services/groupsService';
import type { CrewGroup } from '../types/groups';
import { tr } from '../i18n';

/**
 * Grupulețele unui eveniment, în timp real. Le vezi doar dacă te-ai înscris la eveniment (`enabled`):
 * regulile Firestore nu lasă pe nimeni altcineva să le citească (audit: cine va fi unde și când).
 */
export function useEventGroups(
  eventId: string,
  enabled = true,
): { groups: CrewGroup[]; loading: boolean; error: string | null } {
  const [groups, setGroups] = useState<CrewGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToEventGroups(
      eventId,
      (next) => {
        setGroups(next);
        setError(null);
        setLoading(false);
      },
      (e) => {
        console.warn('Nu am putut încărca grupulețele:', e);
        setError(tr('Nu am putut încărca grupurile. Verifică conexiunea la internet.'));
        setLoading(false);
      },
    );
  }, [eventId, enabled]);

  return { groups, loading, error };
}
