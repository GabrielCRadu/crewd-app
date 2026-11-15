import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Event } from '../types/events';
import { formatTime } from '../utils/dates';
import { formatDistance } from '../utils/distance';
import { tr } from '../i18n';
import { reminderIdFor, reminderPlan } from '../utils/reminderPlan';

/*
 * Reamintiri locale: cu o oră înainte de un eveniment la care te-ai înscris, telefonul îți arată
 * „Open Mic: Stand-up Night începe la 20:00, e la 1,2 km.” Merg și în Expo Go (sunt locale, nu push).
 * Dacă te înscrii cu mai puțin de o oră înainte, reamintirea vine după câteva secunde.
 */

/** Cu cât timp înainte de început vine reamintirea. */
const REMIND_BEFORE_MS = 60 * 60 * 1000;
/** Dacă ora reamintirii a trecut deja, o arătăm după atâtea secunde. */
const SOON_SECONDS = 5;
const CHANNEL_ID = 'event-reminders';

// Arată reamintirea și când aplicația e deschisă.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permission: boolean | null = null;
/** Sincronizările rulează pe rând, ca să nu programăm aceeași reamintire de două ori. */
let queue: Promise<void> = Promise.resolve();

async function ensurePermission(): Promise<boolean> {
  if (permission !== null) return permission;
  if (Platform.OS === 'android') {
    // Pe Android 13+ cererea de permisiune apare doar după ce există un canal.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reamintiri evenimente',
      importance: Notifications.AndroidImportance.HIGH,
      // Pe ecranul blocat nu apar titlul evenimentului și distanța.
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  permission = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  return permission;
}

function reminderBody(event: Event, distanceKm: number): string {
  return tr('{title} începe la {time}, e la {distance}.', {
    title: event.title,
    time: formatTime(event.startsAt),
    distance: formatDistance(distanceKm),
  });
}

const SHOWN_KEY = 'crewd.remindersShown';

/** Stocarea telefonului, încărcată doar când e nevoie. */
async function storage() {
  return (await import('@react-native-async-storage/async-storage')).default;
}

/** Evenimentele a căror reamintire a apărut deja (sau a fost programată „imediat”): nu se mai programează. */
async function shownIds(): Promise<string[]> {
  try {
    const raw = await (await storage()).getItem(SHOWN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function rememberShown(ids: string[]): Promise<void> {
  try {
    await (await storage()).setItem(SHOWN_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    // Nu e grav: în cel mai rău caz, o reamintire mai apare o dată.
  }
}

async function sync(upcomingJoined: Event[], distanceKm: (event: Event) => number): Promise<void> {
  // Starea vine din telefon (supraviețuiește repornirii), nu din memorie.
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const programmed = all.map((n) => n.identifier);
  // Reamintiri din versiuni vechi (fără id fix): se anulează o dată, ca să nu se dubleze.
  const legacy = all
    .filter((n) => !n.identifier.startsWith('reminder-') && typeof n.content.data?.eventId === 'string')
    .map((n) => n.identifier);
  const now = Date.now();
  // Evenimentele pentru care am programat deja o reamintire (ținute minte pe telefon). Dacă ora ei a trecut,
  // a apărut deja: nu se mai programează (altfel ar reveni la fiecare pornire în ultima oră).
  const ever = new Set(await shownIds());
  const joinedIds = new Set(upcomingJoined.map((e) => e.id));
  const shown = upcomingJoined
    .filter((e) => ever.has(e.id) && e.startsAt.getTime() - REMIND_BEFORE_MS <= now + SOON_SECONDS * 1000)
    .map((e) => e.id);
  const plan = reminderPlan(
    upcomingJoined.map((e) => e.id),
    programmed,
    shown,
    legacy,
  );
  // Anulăm reamintirile evenimentelor la care nu mai ești înscris.
  for (const id of plan.cancel) await Notifications.cancelScheduledNotificationAsync(id);

  // Ținem minte doar evenimentele la care ești încă înscris (dacă ieși și reintri, primești din nou reamintirea).
  const remembered = [...ever].filter((id) => joinedIds.has(id));
  const missing = upcomingJoined.filter((e) => plan.add.includes(e.id));
  if (missing.length === 0 || !(await ensurePermission())) {
    if (remembered.length !== ever.size) await rememberShown(remembered);
    return;
  }

  for (const event of missing) {
    const remindAt = event.startsAt.getTime() - REMIND_BEFORE_MS;
    const trigger: Notifications.NotificationTriggerInput =
      remindAt > now + SOON_SECONDS * 1000
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(remindAt), channelId: CHANNEL_ID }
        : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: SOON_SECONDS, channelId: CHANNEL_ID };
    await Notifications.scheduleNotificationAsync({
      identifier: reminderIdFor(event.id),
      content: { title: tr('Reamintire'), body: reminderBody(event, distanceKm(event)), data: { eventId: event.id } },
      trigger,
    });
    remembered.push(event.id);
  }
  await rememberShown(remembered);
}

/**
 * Ține reamintirile la zi: una pentru fiecare eveniment viitor la care ești înscris,
 * niciuna pentru cele la care ai renunțat.
 */
export function syncEventReminders(upcomingJoined: Event[], distanceKm: (event: Event) => number): Promise<void> {
  queue = queue.then(() => sync(upcomingJoined, distanceKm)).catch((e: unknown) => {
    console.warn('Nu am putut programa reamintirile:', e);
  });
  return queue;
}

/** Apăsarea pe o reamintire: primești id-ul evenimentului. Returnează o funcție de dezabonare. */
export function subscribeToReminderTaps(onTap: (eventId: string) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const eventId = response.notification.request.content.data?.eventId;
    if (typeof eventId === 'string') onTap(eventId);
  });
  return () => subscription.remove();
}

/** La ieșirea din cont: nicio reamintire a contului vechi nu mai sună. */
export async function cancelAllReminders(): Promise<void> {
  queue = queue.then(() => Notifications.cancelAllScheduledNotificationsAsync()).catch((e: unknown) => {
    console.warn('Nu am putut anula reamintirile:', e);
  });
  return queue;
}
