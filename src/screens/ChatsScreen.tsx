import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useNow } from '../hooks/useNow';
import { useUserLocation } from '../hooks/useUserLocation';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { CrewGroup } from '../types/groups';
import { formatDay, formatTime } from '../utils/dates';
import { MIN_FORM_MEMBERS, canOpenChat, groupStatus } from '../utils/groupRules';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatsHome'>;

/**
 * Tab-ul Chat: grupulețele tale de la evenimente (docs/superpowers/specs/2026-11-13-grupulete-design.md).
 * Cele în formare apar marcate și nu deschid conversația până la 3 membri.
 */
export default function ChatsScreen({ navigation }: Props) {
  const { groups, loading } = useMyGroups();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const now = useNow();

  const titleOf = (g: CrewGroup) => events.find((e) => e.id === g.eventId)?.title ?? 'Eveniment';
  const sorted = [...groups].sort((a, b) => a.meetupAt.getTime() - b.meetupAt.getTime());

  const open = (g: CrewGroup) => {
    if (!canOpenChat(g)) {
      if (groupStatus(g, now) === 'expired') {
        Alert.alert('Grupulețul nu s-a format', 'Nu s-au strâns 3 persoane la timp. Alege alt grupuleț de la eveniment.');
      } else {
        Alert.alert('Grupulețul se formează', `Chat-ul se deschide când sunteți cel puțin ${MIN_FORM_MEMBERS}.`);
      }
      return;
    }
    navigation.navigate('ChatRoom', { eventId: g.eventId, groupId: g.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Chat-uri</Text>
        <Text style={styles.sectionTitle}>Grupulețele tale</Text>

        {loading ? <ActivityIndicator color={colors.text} /> : null}
        {!loading && sorted.length === 0 ? (
          <Text style={styles.empty}>Intră într-un grupuleț de la un eveniment ca să-l vezi aici.</Text>
        ) : null}

        {sorted.map((g) => {
          const status = groupStatus(g, now);
          const title = titleOf(g);
          return (
            <Pressable key={g.id} onPress={() => open(g)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.groupRow}>
                <Avatar name={title} size={48} square initials={2} />
                <View style={styles.groupText}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.members} numberOfLines={1}>
                    {Object.values(g.members)
                      .map((m) => m.name)
                      .join(', ')}
                  </Text>
                </View>
                {!canOpenChat(g) ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {status === 'expired' ? 'Nu s-a format' : `Se formează · ${g.memberUids.length}/${MIN_FORM_MEMBERS}`}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.meetupBand}>
                <Text style={styles.meetupText}>
                  Ne vedem {formatDay(g.meetupAt, now).toLowerCase()} la {formatTime(g.meetupAt)} · {g.meetupPlace}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.5, color: colors.text, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 12 },
  empty: { fontSize: 14, color: colors.muted },
  card: { ...glass, padding: 14, gap: 12, borderRadius: radii.card },
  pressed: { opacity: 0.8 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupText: { flex: 1, gap: 3 },
  groupName: { fontSize: 16, fontWeight: '600', color: colors.text },
  members: { fontSize: 13, color: colors.muted },
  badge: { backgroundColor: colors.cardStrong, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  meetupBand: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.inner, backgroundColor: colors.card },
  meetupText: { fontSize: 12, fontWeight: '500', color: colors.text },
});
