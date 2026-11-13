import { useEffect, useState } from 'react';

import { getEvents } from '../services/eventsService';
import type { Event } from '../types/events';

/** Încarcă lista de evenimente din eventsService. */
export function useEvents(): { events: Event[]; loading: boolean } {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `active` previne actualizarea stării dacă ecranul s-a închis între timp.
    let active = true;
    getEvents()
      .then((list) => {
        if (active) setEvents(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { events, loading };
}
