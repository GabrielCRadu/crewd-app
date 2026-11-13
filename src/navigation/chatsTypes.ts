/** Ecranele din tab-ul Chat și parametrii lor. */
export type ChatsStackParamList = {
  ChatsHome: undefined;
  ChatRoom: { groupId: string };
  /** Profilul autorului unui mesaj. */
  PersonProfile: { personId: string };
};
