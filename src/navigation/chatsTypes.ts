/** Ecranele din tab-ul Chat și parametrii lor. */
export type ChatsStackParamList = {
  ChatsHome: undefined;
  /** Conversația unui grupuleț de la un eveniment. */
  ChatRoom: { eventId: string; groupId: string };
  /** Profilul autorului unui mesaj. */
  PersonProfile: { personId: string };
};
