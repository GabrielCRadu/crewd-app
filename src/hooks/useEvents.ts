import { useEffect, useState } from 'react';

import { getEvents } from '../services/eventsService';
import type { Event, LatLng } from '../types/events';

/** Încarcă evenimentele din jurul locației date (se reîncarcă dacă locația se schimbă). */
export function useEvents(near: LatLng): { events: Event[]; loading: boolean } {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `active` previne actualizarea stării dacă ecranul s-a închis între timp.
    let active = true;
    getEvents(near)
      .then((list) => {
        if (active) setEvents(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [near.latitude, near.longitude]);

  return { events, loading };
}
