import type { Memory } from '../types/memories';

/*
 * Amintiri mock ale celorlalte persoane (PEOPLE din mockSocial.ts), ca secțiunea să nu fie goală.
 * Pozele sunt de pe Unsplash, fără fețe (aceleași fotografii ca la profilurile mock).
 * e16–e18 sunt evenimentele trecute din istoricul tău (mockEvents.ts): la ele „ați fost împreună”.
 * Amintirile tale pornesc goale: le adaugi din aplicație.
 */

const photo = (photoId: string) => `https://images.unsplash.com/${photoId}?w=900&q=70`;

const DAY = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

function mock(
  id: string,
  ownerId: string,
  eventId: string,
  eventTitle: string,
  eventDaysAgo: number,
  photoId: string,
  visibility: Memory['visibility'] = 'everyone',
): Memory {
  return {
    id,
    ownerId,
    eventId,
    eventTitle,
    eventDate: daysAgo(eventDaysAgo),
    photoUri: photo(photoId),
    visibility,
    createdAt: daysAgo(Math.max(eventDaysAgo - 1, 0)),
  };
}

export const INITIAL_MEMORIES: Memory[] = [
  // Maria (prietenă)
  mock('m1', 'p1', 'e16', 'Concert de jazz în pivniță', 1, 'photo-1511192336575-5a79af67a629'),
  mock('m2', 'p1', 'e17', 'Seară de karaoke', 3, 'photo-1493225457124-a3eb161ffa5f', 'friends'),
  mock('m3', 'p1', 'x1', 'Festival în parc', 20, 'photo-1459749411175-04bf5292ceea'),
  // Andrei (prieten)
  mock('m4', 'p2', 'e16', 'Concert de jazz în pivniță', 1, 'photo-1470225620780-dba8ba36b745', 'friends'),
  mock('m5', 'p2', 'x2', 'Noapte de techno', 12, 'photo-1516035069371-29a1b244cc32'),
  // Ioana (prietenă)
  mock('m6', 'p3', 'e17', 'Seară de karaoke', 3, 'photo-1503095396549-807759245b35'),
  // Victor (nu e prieten: amintirea „doar prieteni” îți rămâne ascunsă)
  mock('m7', 'p4', 'e18', 'Drumeție pe dealuri', 5, 'photo-1506905925346-21bda4d32df4'),
  mock('m8', 'p4', 'x3', 'Tură pe creastă', 30, 'photo-1464822759023-fed622ff2c3b', 'friends'),
];
