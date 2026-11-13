import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import SegmentedControl from '../components/SegmentedControl';
import CategoryChips from '../components/events/CategoryChips';
import EventsMap from '../components/events/EventsMap';
import NowCard from '../components/events/NowCard';
import UpcomingEventRow from '../components/events/UpcomingEventRow';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { getLocationNotice, useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined, joinEvent } from '../services/preferencesService';
import { colors } from '../theme/colors';
import type { CategoryId } from '../types/events';
import { isLive } from '../utils/dates';
import { addDistance, isUpcomingOrLive, matchesCategories, sortByDate } from '../utils/eventFilters';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsHome'>;
type Mode = 'list' | 'map';

/**
 * Ecranul principal al tab-ului (docs/layout-guide.md → Tab Evenimente):
 * titlu → Listă | Hartă → categorii → cardul „ACUM” → „Urmează”.
 * În modul Hartă, conținutul de sub categorii e înlocuit de hartă.
 */
export default function EventsScreen({ navigation }: Props) {
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const preferences = usePreferences();

  const [mode, setMode] = useState<Mode>('list');
  const [categoryIds, setCategoryIds] = useState<CategoryId[]>([]);

  // Evenimentele încă neterminate, din categoriile alese, cu distanța până la tine, sortate după oră.
  const visible = useMemo(
    () =>
      sortByDate(
        addDistance(events, location.coords).filter((e) => isUpcomingOrLive(e) && matchesCategories(e, categoryIds)),
      ),
    [events, location.coords, categoryIds],
  );
  // „ACUM” = cel mai apropiat eveniment în desfășurare; restul intră în „Urmează”.
  const now = useMemo(
    () => [...visible].filter((e) => isLive(e)).sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null,
    [visible],
  );
  const upcoming = visible.filter((e) => e.id !== now?.id);

  const openEvent = (eventId: string) => navigation.navigate('EventDetails', { eventId });
  const locationNotice = getLocationNotice(location.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Evenimente</Text>
        <SegmentedControl
          options={[
            { value: 'list', label: 'Listă' },
            { value: 'map', label: 'Hartă' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      <CategoryChips selected={categoryIds} onChange={setCategoryIds} />

      {locationNotice ? <Text style={styles.notice}>{locationNotice}</Text> : null}

      {mode === 'map' ? (
        <EventsMap
          events={visible}
          userLocation={location.coords}
          showUserLocation={location.status === 'granted'}
          onOpenEvent={openEvent}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {now ? (
            <NowCard
              event={now}
              joined={isJoined(preferences, now.id)}
              onJoin={() => joinEvent(now)}
              onOpen={() => openEvent(now.id)}
            />
          ) : null}

          <Text style={styles.sectionTitle}>Urmează</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.empty}>Niciun eveniment pentru categoriile alese.</Text>
          ) : (
            upcoming.map((e) => (
              <UpcomingEventRow
                key={e.id}
                event={e}
                joined={isJoined(preferences, e.id)}
                onPress={() => openEvent(e.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14 },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  notice: { marginHorizontal: 20, marginTop: 10, fontSize: 12, color: colors.faint },
  content: { padding: 20, paddingTop: 16, paddingBottom: 32, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 10 },
  empty: { fontSize: 14, color: colors.muted },
});
