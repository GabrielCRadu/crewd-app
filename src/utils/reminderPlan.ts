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

/** Evenimentele de programat și reamintirile de anulat, față de ce e deja programat pe telefon. */
export function reminderPlan(upcomingJoinedIds: string[], scheduledIds: string[]): { add: string[]; cancel: string[] } {
  const reminders = scheduledIds.filter((id) => id.startsWith(PREFIX));
  const wanted = new Set(upcomingJoinedIds.map(reminderIdFor));
  return {
    add: upcomingJoinedIds.filter((eventId) => !reminders.includes(reminderIdFor(eventId))),
    cancel: reminders.filter((id) => !wanted.has(id)),
  };
}
