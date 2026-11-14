import { describe, expect, it } from '@jest/globals';

import type { Event } from '../../types/events';
import { googleCalendarUrl, toGoogleDate } from '../googleCalendar';

function event(overrides: Partial<Event> = {}): Event {
  return {
    title: 'Concert de jazz în pivniță',
    startsAt: new Date('2026-11-20T20:00:00+02:00'),
    endsAt: new Date('2026-11-20T23:00:00+02:00'),
    venueName: 'Pivnița de jazz',
    address: 'Strada Mercy 5',
    description: 'Un trio de jazz & blues.',
    timeNote: null,
    source: { name: 'iaBilet', url: 'https://iabilet.ro/x?a=1&b=2' },
    ticketUrl: null,
    ...overrides,
  } as Event;
}

/** Parametrii linkului, decodați. */
function paramsOf(url: string): Record<string, string> {
  const query = url.split('?')[1] ?? '';
  return Object.fromEntries(
    query.split('&').map((pair) => {
      const [k, v] = pair.split('=');
      return [k!, decodeURIComponent(v ?? '')];
    }),
  );
}

describe('Google Calendar', () => {
  it('datele sunt în UTC, în formatul cerut de Google', () => {
    expect(toGoogleDate(new Date('2026-11-20T20:00:00+02:00'))).toBe('20261120T180000Z');
  });

  it('linkul deschide pagina de creare cu titlul și intervalul evenimentului', () => {
    const url = googleCalendarUrl(event());
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);
    const p = paramsOf(url);
    expect(p.action).toBe('TEMPLATE');
    expect(p.text).toBe('Concert de jazz în pivniță');
    expect(p.dates).toBe('20261120T180000Z/20261120T210000Z');
  });

  it('locul are numele și adresa; adresa lipsă sau identică nu se repetă', () => {
    expect(paramsOf(googleCalendarUrl(event())).location).toBe('Pivnița de jazz, Strada Mercy 5');
    expect(paramsOf(googleCalendarUrl(event({ address: '' }))).location).toBe('Pivnița de jazz');
    expect(paramsOf(googleCalendarUrl(event({ address: 'Pivnița de jazz' }))).location).toBe('Pivnița de jazz');
  });

  it('descrierea are textul, linkul sursei și mențiunea Crewd', () => {
    const details = paramsOf(googleCalendarUrl(event({ timeNote: 'Accesul de la 19:30' }))).details;
    expect(details).toBe(
      'Un trio de jazz & blues.\n\nAccesul de la 19:30\n\nDetalii: https://iabilet.ro/x?a=1&b=2\n\nAdăugat din Crewd',
    );
  });

  it('fără sursă folosește linkul de bilete; fără niciunul, nu pune „Detalii”', () => {
    const withTicket = paramsOf(googleCalendarUrl(event({ source: null, ticketUrl: 'https://bilete.ro/1' }))).details;
    expect(withTicket).toContain('Detalii: https://bilete.ro/1');
    const none = paramsOf(googleCalendarUrl(event({ source: null, description: '' }))).details;
    expect(none).toBe('Adăugat din Crewd');
  });

  it('caracterele speciale sunt codate, ca linkul să rămână valid', () => {
    const url = googleCalendarUrl(event());
    expect(url).not.toMatch(/[ &]blues/);
    expect(url.split('?')[1]!.split('&')).toHaveLength(5);
  });
});
