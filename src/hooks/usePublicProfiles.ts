import { useEffect, useState } from 'react';

import { isFirebaseConfigured } from '../lib/firebase';
import { getPublicProfile } from '../services/publicProfileService';
import type { PublicProfile } from '../types/user';

/** Profilurile publice ale mai multor conturi reale (ex. lista de prieteni); null cât nu s-a încărcat sau lipsește. */
export function usePublicProfiles(uids: string[]): Record<string, PublicProfile | null> {
  const key = [...uids].sort().join(',');
  const [profiles, setProfiles] = useState<Record<string, PublicProfile | null>>({});

  useEffect(() => {
    if (!isFirebaseConfigured || !key) return;
    let active = true;
    const ids = key.split(',');
    void Promise.all(
      ids.map((id) =>
        getPublicProfile(id).catch((e: unknown) => {
          console.warn('Nu am putut încărca profilul public:', e);
          return null;
        }),
      ),
    ).then((loaded) => {
      if (!active) return;
      const next: Record<string, PublicProfile | null> = {};
      ids.forEach((id, i) => (next[id] = loaded[i] ?? null));
      setProfiles(next);
    });
    return () => {
      active = false;
    };
  }, [key]);

  return profiles;
}
