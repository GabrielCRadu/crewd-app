import { useEffect, useState } from 'react';

/** Ora curentă, reîmprospătată periodic (implicit la un minut), ca stările care depind de timp să se schimbe singure. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
