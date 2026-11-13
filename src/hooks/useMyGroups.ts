import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { MOCK_UID, subscribeToMyGroups } from '../services/groupsService';
import { isFirebaseConfigured } from '../lib/firebase';
import type { CrewGroup } from '../types/groups';

/** Grupulețele în care sunt (la toate evenimentele), în timp real. */
export function useMyGroups(): { groups: CrewGroup[]; loading: boolean } {
  const { user } = useAuth();
  const uid = isFirebaseConfigured ? (user?.uid ?? null) : MOCK_UID;
  const [groups, setGroups] = useState<CrewGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToMyGroups(
      uid,
      (next) => {
        setGroups(next);
        setLoading(false);
      },
      (e) => {
        console.warn('Nu am putut încărca grupulețele tale:', e);
        setLoading(false);
      },
    );
  }, [uid]);

  return { groups, loading };
}
