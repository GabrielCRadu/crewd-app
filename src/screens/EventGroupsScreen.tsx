import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import GlassIconButton from '../components/GlassIconButton';
import GradientButton from '../components/GradientButton';
import EventGroupsSection from '../components/groups/EventGroupsSection';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useNow } from '../hooks/useNow';
import { usePreferences } from '../hooks/usePreferences';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { leaveGroup } from '../services/groupsService';
import { isJoined } from '../services/preferencesService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { formatDay, formatTime } from '../utils/dates';
import { MIN_FORM_MEMBERS, canOpenChat, groupStatus } from '../utils/groupRules';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventGroups'>;

/**
 * Grupulețele unui eveniment, pe un ecran separat (deschis din detalii cu „Vezi grupulețele”):
 * sus starea grupulețului tău (chat, se formează, nu s-a format), apoi lista și „Propune unul”.
 */
export default function EventGroupsScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const preferences = usePreferences();
  const { groups: myGroups } = useMyGroups();
  const now = useNow();
  const { user, profile } = useAuth();

  const event = events.find((e) => e.id === eventId) ?? null;
  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  const joined = isJoined(preferences, event.id);
  const myGroup = myGroups.find((g) => g.eventId === event.id) ?? null;
  const status = myGroup ? groupStatus(myGroup, now) : null;
  const missing = myGroup ? Math.max(0, MIN_FORM_MEMBERS - myGroup.memberUids.length) : 0;

  const openChat = () => {
    if (!myGroup) return;
    navigation
      .getParent()
      ?.navigate('Chats', { screen: 'ChatRoom', params: { eventId: event.id, groupId: myGroup.id }, initial: false });
  };

  // „Ieși din grupuleț”: rămâi înscris la eveniment și poți alege alt grupuleț.
  const confirmLeaveGroup = () => {
    const uid = user?.uid ?? profile?.uid;
    if (!myGroup || !uid) return;
    Alert.alert('Ieși din grupuleț?', 'Rămâi înscris la eveniment și poți alege alt grupuleț.', [
      { text: 'Rămân', style: 'cancel' },
      {
        text: 'Ies',
        style: 'destructive',
        onPress: () => {
          leaveGroup(event.id, myGroup.id, uid).catch((e: Error) => Alert.alert('Nu ai ieșit din grupuleț', e.message));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Grupulețe</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {event.title} · {formatDay(event.startsAt, now)}, {formatTime(event.startsAt)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Grupulețul tău */}
        {myGroup ? (
          <View style={styles.mine}>
            {canOpenChat(myGroup) ? (
              <>
                <Text style={styles.mineTitle}>Ești în grupuleț</Text>
                <Text style={styles.mineText}>
                  {myGroup.memberUids.length} persoane · ne vedem la {formatTime(myGroup.meetupAt)}, {myGroup.meetupPlace}
                </Text>
                <GradientButton label="Deschide chat-ul" icon="chatbubbles" onPress={openChat} />
              </>
            ) : status === 'expired' ? (
              <>
                <View style={styles.mineRow}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.nope} />
                  <Text style={styles.mineTitle}>Grupulețul nu s-a format</Text>
                </View>
                <Text style={styles.mineText}>Nu s-au strâns 3 persoane la timp. Alege alt grupuleț sau propune unul.</Text>
              </>
            ) : (
              <>
                <Text style={styles.mineTitle}>
                  Așteptăm încă {missing} {missing === 1 ? 'persoană' : 'persoane'}
                </Text>
                <Text style={styles.mineText}>
                  Chat-ul se deschide când sunteți cel puțin {MIN_FORM_MEMBERS}. Ne vedem la {formatTime(myGroup.meetupAt)},{' '}
                  {myGroup.meetupPlace}.
                </Text>
              </>
            )}
            <Pressable onPress={confirmLeaveGroup} hitSlop={8} style={styles.leave}>
              <Ionicons name="exit-outline" size={16} color={colors.muted} />
              <Text style={styles.leaveText}>Ieși din grupuleț</Text>
            </Pressable>
          </View>
        ) : null}

        <EventGroupsSection
          event={event}
          joined={joined}
          myGroup={myGroup}
          onPropose={() => navigation.navigate('ProposeGroup', { eventId: event.id })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 26, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 16 },
  mine: { ...glass, gap: 10, padding: 16, borderRadius: radii.card, borderColor: colors.text },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mineTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  mineText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  leave: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  leaveText: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
});
