import type { CategoryId, Period } from '../types/events';

/** Ecranele din tab-ul Evenimente și parametrii pe care îi primește fiecare. */
export type EventsStackParamList = {
  EventsHome: undefined;
  EventsList: { period: Period; categoryIds: CategoryId[] };
  EventDetails: { eventId: string };
};
