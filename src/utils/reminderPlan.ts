/*
 * Ce reamintiri trebuie programate sau anulate (audit 2026-11-14: reamintirile se dublau la fiecare
 * pornire și nu se anulau după ce ieșeai din eveniment). Starea vine din telefon (notificările programate),
 * nu din memorie, iar fiecare reamintire are un id fix după eveniment.
 */

const PREFIX = 'reminder-';

/** Id-ul fix al reamintirii unui eveniment (o singură reamintire per eveniment). */
export function reminderIdFor(eventId: string): string {
  return `${PREFIX}${eventId}`;
}

/**
 * Evenimentele de programat și reamintirile de anulat, față de ce e deja programat pe telefon.
 * - `shownEventIds`: evenimentele a căror reamintire a apărut deja (nu se mai programează din nou);
 * - `legacyIds`: reamintiri din versiuni vechi (fără id fix), care se anulează.
 */
export function reminderPlan(
  upcomingJoinedIds: string[],
  scheduledIds: string[],
  shownEventIds: string[] = [],
  legacyIds: string[] = [],
): { add: string[]; cancel: string[] } {
  const reminders = scheduledIds.filter((id) => id.startsWith(PREFIX));
  const wanted = new Set(upcomingJoinedIds.map(reminderIdFor));
  return {
    add: upcomingJoinedIds.filter((eventId) => !reminders.includes(reminderIdFor(eventId)) && !shownEventIds.includes(eventId)),
    cancel: [...reminders.filter((id) => !wanted.has(id)), ...legacyIds],
  };
}
