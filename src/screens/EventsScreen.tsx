import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenGlow from '../components/ScreenGlow';
import SegmentedControl from '../components/SegmentedControl';
import CategoryChips from '../components/events/CategoryChips';
import EventsMap from '../components/events/EventsMap';
import NowCarousel from '../components/events/NowCarousel';
import UpcomingEventRow from '../components/events/UpcomingEventRow';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { getLocationNotice, useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined } from '../services/preferencesService';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
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
  const { events, loading, error } = useEvents(location.coords);
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
  // „ACUM” = toate evenimentele în desfășurare (cel mai apropiat primul); restul intră în „Urmează”.
  const liveNow = useMemo(
    () => visible.filter((e) => isLive(e)).sort((a, b) => a.distanceKm - b.distanceKm),
    [visible],
  );
  const upcoming = visible.filter((e) => !isLive(e));

  const openEvent = (eventId: string) => navigation.navigate('EventDetails', { eventId });
  const locationNotice = getLocationNotice(location.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Lumina caldă de sus, ca în referințele de design */}
      <ScreenGlow />

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

      {/* Mesajul despre locație: pastilă de sticlă, ca să se citească pe fundalul închis */}
      {locationNotice ? (
        <View style={styles.notice}>
          <Ionicons name="location-outline" size={16} color={colors.text} />
          <Text style={styles.noticeText}>{locationNotice}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.notice}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.text} />
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : null}

      {mode === 'map' ? (
        <EventsMap
          events={visible}
          userLocation={location.coords}
          showUserLocation={location.status === 'granted'}
          onOpenEvent={openEvent}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {liveNow.length > 0 ? (
            <NowCarousel events={liveNow} onOpen={openEvent} />
          ) : null}

          <Text style={styles.sectionTitle}>Urmează</Text>
          {loading ? (
            <ActivityIndicator color={colors.text} style={styles.loader} />
          ) : upcoming.length === 0 ? (
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
  title: { ...type.screenTitle, fontSize: 32 },
  notice: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.inner,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.text },
  content: { padding: 20, paddingTop: 16, paddingBottom: 32, gap: 12 },
  sectionTitle: { ...type.label, marginTop: 10 },
  empty: { fontSize: 14, color: colors.muted },
  loader: { marginTop: 24 },
});
