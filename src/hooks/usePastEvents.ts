import { useMemo } from 'react';

import { isJoined } from '../services/preferencesService';
import type { Event } from '../types/events';
import { hasEnded } from '../utils/dates';
import { useEvents } from './useEvents';
import { usePreferences } from './usePreferences';
import { useUserLocation } from './useUserLocation';

/** Evenimentele la care te-ai înscris și care s-au terminat, cele mai recente primele (istoricul din Profil). */
export function usePastEvents(): Event[] {
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const preferences = usePreferences();

  return useMemo(
    () =>
      events
        .filter((e) => isJoined(preferences, e.id) && hasEnded(e))
        .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    [events, preferences],
  );
}
