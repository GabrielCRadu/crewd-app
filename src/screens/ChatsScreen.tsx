import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import HeaderLogo from '../components/HeaderLogo';
import DirectThreadsSection from '../components/DirectThreadsSection';
import GroupAvatar from '../components/GroupAvatar';
import SegmentedControl from '../components/SegmentedControl';
import { useAuth } from '../context/AuthContext';
import { useChatActivity } from '../context/ChatActivity';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useNow } from '../hooks/useNow';
import { useUserLocation } from '../hooks/useUserLocation';
import { isFirebaseConfigured } from '../lib/firebase';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { MOCK_UID } from '../services/groupsService';
import { colors, onThemeChange } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { CrewGroup } from '../types/groups';
import { shortWhen, sortGroupsByActivity } from '../utils/chatListRules';
import { lastMessagePreview } from '../utils/chatRules';
import { formatDay, formatTime } from '../utils/dates';
import { MIN_FORM_MEMBERS, canOpenChat, groupStatus } from '../utils/groupRules';
import { tr } from '../i18n';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatsHome'>;

type ChatTab = 'groups' | 'direct';

/** Eticheta unui tab, cu numărul conversațiilor necitite în paranteză („Grupuri (2)”). */
const withCount = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

/**
 * Tab-ul Chat: două tab-uri sub bara de sus, „Grupuri” (grupulețele de la evenimente) și „Mesaje directe”.
 * Se schimbă doar apăsând (tragerea schimbă tab-urile de jos). Tab-ul ales rămâne la întoarcerea din conversație.
 * Grupurile în formare apar marcate și nu deschid conversația până la 3 membri.
 */
export default function ChatsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<ChatTab>('groups');
  const { groups, loading } = useMyGroups();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const now = useNow();
  const { user } = useAuth();
  const myUid = isFirebaseConfigured ? (user?.uid ?? '') : MOCK_UID;
  const { groupLast, unreadGroupIds, unreadDmIds } = useChatActivity();

  const eventOf = (g: CrewGroup) => events.find((e) => e.id === g.eventId) ?? null;
  const sorted = sortGroupsByActivity(groups, groupLast);

  const open = (g: CrewGroup) => {
    if (!canOpenChat(g)) {
      if (groupStatus(g, now) === 'expired') {
        Alert.alert(tr('Grupul nu s-a format'), tr('Nu s-au strâns 3 persoane la timp. Alege alt grup de la eveniment.'));
      } else {
        Alert.alert(tr('Grupul se formează'), tr('Chat-ul se deschide când sunteți cel puțin {MIN_FORM_MEMBERS}.', { MIN_FORM_MEMBERS: MIN_FORM_MEMBERS }));
      }
      return;
    }
    navigation.navigate('ChatRoom', { eventId: g.eventId, groupId: g.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeaderLogo label={tr('Chat-uri')} />
        <SegmentedControl
          options={[
            { value: 'groups', label: withCount(tr('Grupuri'), unreadGroupIds.length) },
            { value: 'direct', label: withCount(tr('Mesaje directe'), unreadDmIds.length) },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'direct' ? (
          // Conversațiile doar cu un prieten (ex. un eveniment trimis)
          <DirectThreadsSection unreadIds={unreadDmIds} onOpen={(personId) => navigation.navigate('DirectChat', { personId })} />
        ) : (
          <>
            {loading ? <ActivityIndicator color={colors.text} /> : null}
            {!loading && sorted.length === 0 ? (
              <Text style={styles.empty}>{tr('Nu ești încă în niciun grup. Înscrie-te la un eveniment și alătură-te unui grup! 🎉')}</Text>
            ) : null}

            {sorted.map((g) => {
              const status = groupStatus(g, now);
              const event = eventOf(g);
              const title = event?.title ?? 'Eveniment';
              const memberNames = Object.values(g.members)
                .map((m) => m.name)
                .join(', ');
              const last = canOpenChat(g) ? (groupLast[g.id] ?? null) : null;
              const unread = unreadGroupIds.includes(g.id);
              return (
                <Pressable key={g.id} onPress={() => open(g)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                  <View style={styles.groupRow}>
                    <GroupAvatar group={g} event={event} title={title} size={48} />
                    <View style={styles.groupText}>
                      <Text style={styles.groupName} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                        {last ? lastMessagePreview(last, myUid) : memberNames}
                      </Text>
                    </View>
                    {!canOpenChat(g) ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {status === 'expired' ? tr('Nu s-a format') : tr('Se formează · {length}/{MIN_FORM_MEMBERS}', { length: g.memberUids.length, MIN_FORM_MEMBERS: MIN_FORM_MEMBERS })}
                        </Text>
                      </View>
                    ) : last ? (
                      <View style={styles.side}>
                        <Text style={styles.time}>{shortWhen(last.createdAt, now)}</Text>
                        {unread ? <View style={styles.dot} accessibilityLabel={tr('Necitit')} /> : null}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.meetupBand}>
                    <Text style={styles.meetupText}>{tr('Ne vedem {day} la {time} · {place}', { day: formatDay(g.meetupAt, now).toLowerCase(), time: formatTime(g.meetupAt), place: g.meetupPlace })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 32, gap: 12 },
    empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 24 },
    card: { ...glass, padding: 14, gap: 12, borderRadius: radii.card },
    pressed: { opacity: 0.8 },
    groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    groupText: { flex: 1, gap: 3 },
    groupName: { fontSize: 16, fontWeight: '600', color: colors.text },
    preview: { fontSize: 13, color: colors.muted },
    previewUnread: { color: colors.text, fontWeight: '600' },
    side: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
    time: { fontSize: 12, color: colors.faint },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.text },
    badge: { backgroundColor: colors.cardStrong, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
    badgeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
    meetupBand: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.inner, backgroundColor: colors.card },
    meetupText: { fontSize: 12, fontWeight: '500', color: colors.text },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
