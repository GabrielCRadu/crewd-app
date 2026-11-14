import { useEffect, useState } from 'react';

import { chatErrorMessage, subscribeToGroupMessages } from '../services/chatService';
import type { GroupMessage } from '../types/chat';

/**
 * Mesajele unui grup, în timp real. `error` e textul pentru utilizator (ex. „Nu mai ești în acest grup.”).
 * `enabled`: ascultăm doar cât timp ești membru; la o reintrare în grup ascultarea pornește din nou
 * (Firestore nu reia singur o ascultare oprită de o eroare de acces).
 */
export function useGroupMessages(
  eventId: string,
  groupId: string,
  enabled = true,
): { messages: GroupMessage[]; loading: boolean; error: string | null } {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToGroupMessages(
      eventId,
      groupId,
      (next) => {
        setMessages(next);
        setError(null);
        setLoading(false);
      },
      (e) => {
        console.warn('Nu am putut încărca mesajele:', e);
        setError(chatErrorMessage(e));
        setLoading(false);
      },
    );
  }, [eventId, groupId, enabled]);

  return { messages, loading, error };
}
