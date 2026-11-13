/** Ecranele din stiva tab-ului Evenimente și parametrii lor. */
export type EventsStackParamList = {
  EventsHome: undefined;
  EventDetails: { eventId: string };
  /** Evaluarea oamenilor cu care ai fost la un eveniment trecut. */
  RateEvent: { eventId: string };
  /** Profilul altei persoane (tag-urile primite și numărul de rapoarte). */
  PersonProfile: { personId: string };
  /** Formularul „Propune un grupuleț” pentru un eveniment. */
  ProposeGroup: { eventId: string };
};
