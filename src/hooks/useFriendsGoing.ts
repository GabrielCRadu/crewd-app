import { useEffect, useState } from 'react';

import { isFirebaseConfigured } from '../lib/firebase';
import { getGoing } from '../services/goingService';

/** Care dintre prietenii tăi reali (uid) s-au înscris la eveniment, din going/{uid}. */
export function useFriendsGoing(eventId: string, friendUids: string[]): string[] {
  const key = [...friendUids].sort().join(',');
  const [going, setGoing] = useState<string[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured || !key) {
      setGoing([]);
      return;
    }
    let active = true;
    const uids = key.split(',');
    void Promise.all(uids.map(async (uid) => ((await getGoing(uid)).includes(eventId) ? uid : null))).then((found) => {
      if (active) setGoing(found.filter((x): x is string => x !== null));
    });
    return () => {
      active = false;
    };
  }, [eventId, key]);

  return going;
}
