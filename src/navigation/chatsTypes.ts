/** Ecranele din tab-ul Chat și parametrii lor. */
export type ChatsStackParamList = {
  ChatsHome: undefined;
  /** `eventId` e opțional doar până la conversațiile pe grupulețe (Task 7). */
  ChatRoom: { groupId: string; eventId?: string };
};
