import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from './AuthContext';
import { useDirectThreads } from '../hooks/useDirectThreads';
import { useMyGroups } from '../hooks/useMyGroups';
import { isFirebaseConfigured } from '../lib/firebase';
import { subscribeToLastMessage } from '../services/chatService';
import { useChatReadState } from '../services/chatReadState';
import { MOCK_UID } from '../services/groupsService';
import type { GroupMessage } from '../types/chat';
import { dmReadKey, groupReadKey, isUnread } from '../utils/chatListRules';
import { canOpenChat } from '../utils/groupRules';

/*
 * Activitatea din chat, pentru toată aplicația: ultimul mesaj din fiecare grup al meu (o singură
 * ascultare per grup) și ce conversații sunt necitite. Folosită de lista din tab-ul Chat și de
 * bulina de pe tab-ul Chat din bara de jos. Montat în RootNavigator, în jurul tab-urilor.
 */

export interface ChatActivity {
  /** groupId → ultimul mesaj (null = niciun mesaj; lipsă = încă se încarcă / chat-ul nu e deschis). */
  groupLast: Record<string, GroupMessage | null>;
  unreadGroupIds: string[];
  unreadDmIds: string[];
}

const EMPTY: ChatActivity = { groupLast: {}, unreadGroupIds: [], unreadDmIds: [] };
const ChatActivityContext = createContext<ChatActivity>(EMPTY);

export function ChatActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const myUid = isFirebaseConfigured ? (user?.uid ?? '') : MOCK_UID;
  const { groups } = useMyGroups();
  const threads = useDirectThreads();
  const read = useChatReadState();
  const [groupLast, setGroupLast] = useState<Record<string, GroupMessage | null>>({});

  // Doar grupurile cu chat deschis (cele în formare n-au încă conversație).
  const chatGroups = groups.filter(canOpenChat);
  const groupsKey = chatGroups.map((g) => `${g.eventId}/${g.id}`).sort().join(',');

  useEffect(() => {
    const pairs = groupsKey ? groupsKey.split(',').map((k) => k.split('/') as [string, string]) : [];
    setGroupLast((prev) => {
      // Rămân doar grupurile în care mai ești.
      const next: Record<string, GroupMessage | null> = {};
      for (const [, groupId] of pairs) if (groupId in prev) next[groupId] = prev[groupId]!;
      return next;
    });
    const unsubscribes = pairs.map(([eventId, groupId]) =>
      subscribeToLastMessage(
        eventId,
        groupId,
        (message) => setGroupLast((prev) => ({ ...prev, [groupId]: message })),
        (e) => console.warn('Nu am putut încărca ultimul mesaj din grup:', e),
      ),
    );
    return () => unsubscribes.forEach((u) => u());
  }, [groupsKey]);

  const value = useMemo<ChatActivity>(() => {
    if (!read.loaded) return { groupLast, unreadGroupIds: [], unreadDmIds: [] };
    const unreadGroupIds = chatGroups
      .filter((g) => {
        const last = groupLast[g.id];
        return isUnread(last ? { at: last.createdAt, mine: last.authorUid === myUid } : null, read.lastRead[groupReadKey(g.eventId, g.id)]);
      })
      .map((g) => g.id);
    const unreadDmIds = Object.entries(threads)
      .filter(([personId, messages]) => {
        const last = messages[messages.length - 1];
        return isUnread(last ? { at: last.sentAt, mine: last.fromMe } : null, read.lastRead[dmReadKey(personId)]);
      })
      .map(([personId]) => personId);
    return { groupLast, unreadGroupIds, unreadDmIds };
    // chatGroups se schimbă odată cu groupsKey (și cu lista de grupuri).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupLast, groups, threads, read, myUid]);

  return <ChatActivityContext.Provider value={value}>{children}</ChatActivityContext.Provider>;
}

/** Ultimele mesaje și conversațiile necitite (vezi ChatActivityProvider). */
export function useChatActivity(): ChatActivity {
  return useContext(ChatActivityContext);
}
