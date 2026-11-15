import { createNavigationContainerRef } from '@react-navigation/native';

/*
 * Navigarea din afara ecranelor (notificări, linkuri, logo-ul din bara de sus).
 * Separat de RootNavigator, ca ecranele să-l poată folosi fără import circular.
 */
export const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

const scrollTopListeners = new Set<() => void>();

/** Ecranul Evenimente se abonează aici, ca logo-ul să-l poată duce sus. */
export function subscribeToEventsScrollTop(listener: () => void): () => void {
  scrollTopListeners.add(listener);
  return () => {
    scrollTopListeners.delete(listener);
  };
}

/**
 * Logo-ul „Crewd”: duce la pagina principală (tab-ul Evenimente, lista de la început, fără ecrane noi
 * puse peste). Dacă ești deja acolo, derulează lista sus.
 */
export function goToEventsHome(): void {
  if (!navigationRef.isReady()) return;
  if (navigationRef.getCurrentRoute()?.name === 'EventsHome') {
    scrollTopListeners.forEach((listener) => listener());
    return;
  }
  navigationRef.navigate('Events', { screen: 'EventsHome' });
}
