import { useEffect, useState } from 'react';

import { isUsernameAvailable } from '../services/usernamesService';
import { isKnownTaken, usernameError } from '../utils/usernameRules';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/** Cât așteptăm după ultima tastă înainte să întrebăm dacă username-ul e liber. */
const DEBOUNCE_MS = 400;

/**
 * Starea username-ului scris: gol, invalid, se verifică, disponibil sau ocupat.
 * `knownTaken`: nume care s-au dovedit luate la salvare (le arătăm „ocupat” fără să mai întrebăm).
 */
export function useUsernameAvailability(username: string, knownTaken: string[] = []): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const takenKey = knownTaken.join('|');

  useEffect(() => {
    if (!username) {
      setStatus('idle');
      return;
    }
    if (usernameError(username)) {
      setStatus('invalid');
      return;
    }
    if (isKnownTaken(username, takenKey ? takenKey.split('|') : [])) {
      setStatus('taken');
      return;
    }
    setStatus('checking');
    let active = true;
    const timer = setTimeout(() => {
      isUsernameAvailable(username)
        .then((free) => {
          if (active) setStatus(free ? 'available' : 'taken');
        })
        .catch((e: unknown) => {
          console.warn('Nu am putut verifica username-ul:', e);
          if (active) setStatus('idle');
        });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, takenKey]);

  return status;
}
