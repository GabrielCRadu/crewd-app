import { useEffect, useState } from 'react';

import { lookupUsername } from '../services/usernamesService';
import type { PublicCard } from '../services/usernamesService';

/** Fișa publică a unui username (poza mică, numele), pentru linkurile din codul QR. */
export function usePublicCard(username: string): { card: PublicCard | null; loading: boolean } {
  const [card, setCard] = useState<PublicCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    lookupUsername(username)
      .then((found) => {
        if (active) setCard(found);
      })
      .catch((e: unknown) => {
        console.warn('Nu am putut încărca fișa publică:', e);
        if (active) setCard(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [username]);

  return { card, loading };
}
