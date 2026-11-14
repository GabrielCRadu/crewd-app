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

async function sync(upcomingJoined: Event[], distanceKm: (event: Event) => number): Promise<void> {
  // Starea vine din telefon (supraviețuiește repornirii), nu din memorie.
  const programmed = (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier);
  const plan = reminderPlan(
    upcomingJoined.map((e) => e.id),
    programmed,
  );
  // Anulăm reamintirile evenimentelor la care nu mai ești înscris.
  for (const id of plan.cancel) await Notifications.cancelScheduledNotificationAsync(id);

  const missing = upcomingJoined.filter((e) => plan.add.includes(e.id));
  if (missing.length === 0 || !(await ensurePermission())) return;

  const now = Date.now();
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
  }
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
