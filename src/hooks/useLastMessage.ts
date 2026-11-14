import { useEffect, useState } from 'react';

import { subscribeToLastMessage } from '../services/chatService';
import type { GroupMessage } from '../types/chat';

/** Ultimul mesaj al unui grup (sau null), în timp real. */
export function useLastMessage(eventId: string, groupId: string): GroupMessage | null {
  const [message, setMessage] = useState<GroupMessage | null>(null);

  useEffect(() => {
    return subscribeToLastMessage(eventId, groupId, setMessage, (e) => {
      // Fără acces (ai ieșit din grup) sau fără rețea: lista arată membrii în loc de ultimul mesaj.
      console.warn('Nu am putut încărca ultimul mesaj:', e);
      setMessage(null);
    });
  }, [eventId, groupId]);

  return message;
}
