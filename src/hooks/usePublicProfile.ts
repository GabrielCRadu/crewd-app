import { useEffect, useState } from 'react';

import { isFirebaseConfigured } from '../lib/firebase';
import { getPublicProfile } from '../services/publicProfileService';
import type { PublicProfile } from '../types/user';

/** Profilul public al unui cont real (profiles/{uid}); null dacă nu există sau nu s-a putut încărca. */
export function usePublicProfile(uid: string | null): { profile: PublicProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(!!uid && isFirebaseConfigured);

  useEffect(() => {
    if (!uid || !isFirebaseConfigured) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getPublicProfile(uid)
      .then((found) => {
        if (active) setProfile(found);
      })
      .catch((e: unknown) => {
        console.warn('Nu am putut încărca profilul public:', e);
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uid]);

  return { profile, loading };
}
