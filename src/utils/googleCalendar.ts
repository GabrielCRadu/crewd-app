import type { Event } from '../types/events';
import { tr } from '../i18n';

/*
 * „Adaugă în Google Calendar”: un link către pagina Google Calendar de creare a unui eveniment,
 * cu titlul, ora, locul și descrierea completate. Utilizatorul confirmă salvarea în contul lui Google.
 * Nu cere permisiuni, login în aplicație sau module native (merge și în Expo Go).
 */

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/render';

/** O dată în formatul cerut de Google, în UTC: 20261114T180000Z. */
export function toGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Locul, cum îl caută Google Maps: „Sala X, Strada Y 1”. */
function locationOf(event: Pick<Event, 'venueName' | 'address'>): string {
  const address = event.address?.trim();
  return address && address !== event.venueName ? `${event.venueName}, ${address}` : event.venueName;
}

/** Descrierea din calendar: textul organizatorului, nota despre oră și de unde afli mai multe. */
function detailsOf(event: Pick<Event, 'description' | 'timeNote' | 'source' | 'ticketUrl'>): string {
  const link = event.source?.url ?? event.ticketUrl;
  return [event.description, event.timeNote, link ? `Detalii: ${link}` : null, tr('Adăugat din Crewd')]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('\n\n');
}

/** Linkul care deschide Google Calendar cu evenimentul completat. */
export function googleCalendarUrl(
  event: Pick<Event, 'title' | 'startsAt' | 'endsAt' | 'venueName' | 'address' | 'description' | 'timeNote' | 'source' | 'ticketUrl'>,
): string {
  const params: [string, string][] = [
    ['action', 'TEMPLATE'],
    ['text', event.title],
    ['dates', `${toGoogleDate(event.startsAt)}/${toGoogleDate(event.endsAt)}`],
    ['location', locationOf(event)],
    ['details', detailsOf(event)],
  ];
  return `${GOOGLE_CALENDAR_URL}?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}
