import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import GlassIconButton from '../components/GlassIconButton';
import EventGroupsSection from '../components/groups/EventGroupsSection';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useNow } from '../hooks/useNow';
import { usePreferences } from '../hooks/usePreferences';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined } from '../services/preferencesService';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { formatDay, formatTime } from '../utils/dates';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventGroups'>;

/**
 * Grupulețele unui eveniment, pe un ecran separat (deschis din detalii cu „Vezi grupulețele”):
 * grupul tău primul (cu „Deschide chat-ul”), celelalte sub „Alte grupuri”, apoi „Propune unul”.
 */
export default function EventGroupsScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const preferences = usePreferences();
  const { groups: myGroups } = useMyGroups();
  const now = useNow();

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

  const openChat = () => {
    if (!myGroup) return;
    navigation
      .getParent()
      ?.navigate('Chats', { screen: 'ChatRoom', params: { eventId: event.id, groupId: myGroup.id }, initial: false });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Grupuri</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {event.title} · {formatDay(event.startsAt, now)}, {formatTime(event.startsAt)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EventGroupsSection
          event={event}
          joined={joined}
          myGroup={myGroup}
          onPropose={() => navigation.navigate('ProposeGroup', { eventId: event.id })}
          onOpenChat={openChat}
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
  title: { ...type.screenTitle, fontSize: 26 },
  subtitle: { fontSize: 13, color: colors.muted },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 16 },
});
