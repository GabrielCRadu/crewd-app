import { useEffect, useMemo, useState } from 'react';

import { isFirebaseConfigured } from '../lib/firebase';
import { isFriendshipVisible } from '../services/friendshipsFirestore';
import { getPerson } from '../services/peopleService';
import { mutualCandidates } from '../utils/friendshipRules';
import { useFriends } from './useFriends';

/**
 * Câți prieteni ai în comun cu un cont real (spec 2026-11-14-prieteni-amintiri-design.md):
 * pentru fiecare prieten Y al tău, se verifică prietenia Y–X (regulile o permit pentru că Y e prietenul tău).
 */
export function useMutualFriends(uid: string | null): { count: number; loading: boolean } {
  const friends = useFriends();
  const candidates = useMemo(
    () => (uid ? mutualCandidates(friends, uid, (id) => !getPerson(id)) : []),
    [friends, uid],
  );
  const key = candidates.join(',');
  const [state, setState] = useState({ count: 0, loading: false });

  useEffect(() => {
    if (!uid || !isFirebaseConfigured || candidates.length === 0) {
      setState({ count: 0, loading: false });
      return;
    }
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    void Promise.all(candidates.map((y) => isFriendshipVisible(y, uid))).then((results) => {
      if (active) setState({ count: results.filter(Boolean).length, loading: false });
    });
    return () => {
      active = false;
    };
    // `key` are aceleași uid-uri ca `candidates`, dar se schimbă doar când se schimbă ele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key]);

  return state;
}
