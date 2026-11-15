import { useEffect, useState } from 'react';

/** Cât de des se reverifică mesajele care așteaptă moderarea (să apară singure după MODERATION_WAIT_MS). */
const TICK_MS = 5_000;

/**
 * Un contor care crește la fiecare 5 s, doar cât timp `waiting` e true (un mesaj așteaptă moderarea).
 * Se pune în dependențele unui useMemo ca filtrul să se refacă; fără mesaje în așteptare nu pornește niciun timer.
 */
export function useModerationTick(waiting: boolean): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [waiting]);
  return tick;
}
