import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import GlassIconButton from '../components/GlassIconButton';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useNow } from '../hooks/useNow';
import { useUserLocation } from '../hooks/useUserLocation';
import { isFirebaseConfigured } from '../lib/firebase';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { MOCK_UID, leaveGroup } from '../services/groupsService';
import { LEFT_GROUP_MESSAGE } from '../services/chatService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { type } from '../theme/typography';
import type { GroupStatus } from '../types/groups';
import { formatDay, formatTime } from '../utils/dates';
import { groupStatus } from '../utils/groupRules';

type Props = NativeStackScreenProps<ChatsStackParamList, 'GroupDetails'>;

const STATUS_LABEL: Record<GroupStatus, string> = {
  forming: 'Se formează',
  formed: 'Format',
  full: 'Plin',
  expired: 'Nu s-a format',
  closed: 'Întâlnirea a trecut',
};

/**
 * Detaliile grupului, deschise din antetul conversației: întâlnirea, vibe-ul, membrii și „Ieși din grup”
 * (spec 2026-11-14-chat-grup-design.md). Numele grupului e titlul evenimentului.
 */
export default function GroupDetailsScreen({ navigation, route }: Props) {
  const { eventId, groupId } = route.params;
  const { groups, loading } = useMyGroups();
  const { user } = useAuth();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const now = useNow();
  const group = groups.find((g) => g.id === groupId) ?? null;
  const event = events.find((e) => e.id === eventId) ?? null;
  const uid = isFirebaseConfigured ? (user?.uid ?? null) : MOCK_UID;

  if (!group) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Text style={styles.emptyText}>{LEFT_GROUP_MESSAGE}</Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.pill}>
              <Text style={styles.pillText}>Înapoi</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  // Cel care a propus primul, apoi ceilalți în ordine alfabetică.
  const members = Object.entries(group.members).sort(([a, ma], [b, mb]) => {
    if (a === group.proposerUid) return -1;
    if (b === group.proposerUid) return 1;
    return ma.name.localeCompare(mb.name, 'ro');
  });

  // Ieși din grup: rămâi înscris la eveniment; te întorci la lista de chat-uri.
  const confirmLeave = () => {
    if (!uid) return;
    Alert.alert('Ieși din grup?', 'Ieși și din chat-ul lui (e același lucru). Rămâi înscris la eveniment și poți alege alt grup.', [
      { text: 'Rămân', style: 'cancel' },
      {
        text: 'Ies',
        style: 'destructive',
        onPress: () => {
          // Întâi înapoi la lista de chat-uri, ca să nu clipească „Nu mai ești în acest grup.” pe ecranele de aici
          // (grupul dispare din lista ta imediat, înainte să se termine salvarea). O eroare apare peste listă.
          const { eventId: groupEventId, id } = group;
          navigation.popToTop();
          leaveGroup(groupEventId, id, uid).catch((e: Error) => Alert.alert('Nu ai ieșit din grup', e.message));
        },
      },
    ]);
  };

  const title = event?.title ?? 'Grup';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" size={40} onPress={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {STATUS_LABEL[groupStatus(group, now)]} · {group.memberUids.length} din {group.maxSize} locuri
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={type.label}>Ne vedem</Text>
          <Text style={styles.body}>
            {formatDay(group.meetupAt, now)} la {formatTime(group.meetupAt)} · {group.meetupPlace}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={type.label}>Vibe</Text>
          <Text style={styles.body}>{group.vibe}</Text>
          {group.tags.length > 0 ? (
            <View style={styles.chips}>
              {group.tags.map((t) => (
                <Chip key={t} label={t} />
              ))}
            </View>
          ) : null}
          <Text style={styles.muted}>
            Vârste {group.minAge}–{group.maxAge}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={type.label}>Membri · {group.memberUids.length}</Text>
          {members.map(([memberUid, m], i) => (
            <View key={memberUid} style={[styles.member, i > 0 && styles.memberDivider]}>
              <Avatar name={m.name || '?'} size={40} photoUrl={m.photo ?? null} />
              <View style={styles.memberText}>
                <Text style={styles.body}>
                  {m.name}, {m.age}
                  {memberUid === group.proposerUid ? <Text style={styles.muted}> · a propus</Text> : null}
                  {memberUid === uid ? <Text style={styles.muted}> · tu</Text> : null}
                </Text>
                {m.tags.length > 0 ? (
                  <Text style={styles.muted} numberOfLines={1}>
                    {m.tags.slice(0, 4).join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <Pressable onPress={confirmLeave} hitSlop={8} style={({ pressed }) => [styles.leave, pressed && styles.pressed]}>
          <Text style={styles.leaveText}>Ieși din grup</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: colors.text },
  pillText: { color: colors.onLight, fontWeight: '600', fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  titleBlock: { gap: 4, marginBottom: 4 },
  title: { ...type.screenTitle, fontSize: 30 },
  subtitle: { color: colors.muted, fontSize: 14 },
  card: { ...glass, borderRadius: radii.card, padding: 16, gap: 8 },
  body: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  memberDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  memberText: { flex: 1, gap: 2 },
  leave: { alignSelf: 'center', paddingVertical: 12, marginTop: 4 },
  leaveText: { color: colors.nope, fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
});
