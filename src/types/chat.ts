/** Un mesaj din conversația unui grup (`events/{eventId}/groups/{groupId}/messages/{id}`). */
export interface GroupMessage {
  id: string;
  authorUid: string;
  /** Numele de la trimitere, ca mesajul să rămână semnat și după ce autorul iese din grup. */
  authorName: string;
  text: string;
  createdAt: Date;
}

/** Un rând din lista conversației: separator de zi sau mesaj. */
export type ChatRow =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      message: GroupMessage;
      isMine: boolean;
      /** Numele autorului deasupra bulei (primul dintr-un șir de mesaje ale aceleiași persoane). */
      showName: boolean;
      /** Miniatura autorului lângă bulă (ultimul dintr-un șir). */
      showAvatar: boolean;
      photo: string | null;
      /** Ora, ex. „18:02”. */
      time: string;
    };
