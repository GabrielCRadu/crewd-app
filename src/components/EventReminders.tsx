import { useEffect, useMemo } from 'react';

import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { useUserLocation } from '../hooks/useUserLocation';
import { isJoined } from '../services/preferencesService';
import { subscribeToReminderTaps, syncEventReminders } from '../services/remindersService';
import { haversineKm } from '../utils/distance';

interface Props {
  /** Apăsarea pe o reamintire deschide evenimentul. */
  onOpenEvent: (eventId: string) => void;
}

/**
 * Fără interfață: când te înscrii sau renunți la un eveniment, programează sau anulează
 * reamintirea cu o oră înainte (src/services/remindersService.ts).
 */
export default function EventReminders({ onOpenEvent }: Props) {
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const preferences = usePreferences();

  const upcomingJoined = useMemo(
    () => events.filter((e) => isJoined(preferences, e.id) && e.startsAt.getTime() > Date.now()),
    [events, preferences],
  );

  useEffect(() => {
    void syncEventReminders(upcomingJoined, (e) => haversineKm(location.coords, e.location));
  }, [upcomingJoined, location.coords]);

  useEffect(() => subscribeToReminderTaps(onOpenEvent), [onOpenEvent]);

  return null;
}
