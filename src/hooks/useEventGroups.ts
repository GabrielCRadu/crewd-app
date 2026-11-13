import { useEffect, useState } from 'react';

import { subscribeToEventGroups } from '../services/groupsService';
import type { CrewGroup } from '../types/groups';

/** Grupulețele unui eveniment, în timp real. */
export function useEventGroups(eventId: string): { groups: CrewGroup[]; loading: boolean; error: string | null } {
  const [groups, setGroups] = useState<CrewGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setError('Nu am putut încărca grupulețele. Verifică conexiunea la internet.');
        setLoading(false);
      },
    );
  }, [eventId]);

  return { groups, loading, error };
}
