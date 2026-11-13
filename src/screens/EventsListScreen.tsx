import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BackButton from '../components/events/BackButton';
import EventCard from '../components/events/EventCard';
import { getCategory } from '../data/categories';
import { useEvents } from '../hooks/useEvents';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { fonts, palette, ui } from '../theme/eventsTheme';
import { addDistance, filterEvents, sortEvents, type SortBy } from '../utils/eventFilters';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'date', label: 'După dată' },
  { value: 'distance', label: 'După distanță' },
];

/** Lista de evenimente pentru perioada și categoriile alese pe pagina principală. */
export default function EventsListScreen({ navigation, route }: Props) {
  const { period, categoryIds } = route.params;
  const { events } = useEvents();
  const location = useUserLocation();
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const list = useMemo(
    () => sortEvents(filterEvents(addDistance(events, location.coords), period, categoryIds), sortBy),
    [events, location.coords, period, categoryIds, sortBy],
  );

  const categoriesText =
    categoryIds.length === 0 ? 'Toate categoriile' : categoryIds.map((id) => getCategory(id).label).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <BackButton onPress={() => navigation.goBack()} />
              <View style={styles.flex}>
                <Text style={styles.title} numberOfLines={1}>
                  {period.label}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {list.length} {list.length === 1 ? 'eveniment' : 'evenimente'} · {categoriesText}
                </Text>
              </View>
            </View>

            {/* Sortare: comutator ca „Listă / Hartă” din machetă */}
            <View style={styles.segment}>
              {SORT_OPTIONS.map((o) => {
                const active = sortBy === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setSortBy(o.value)}
                    style={[styles.segmentItem, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={48} color={palette.muted} />
            <Text style={styles.emptyText}>Niciun eveniment în perioada și categoriile alese.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 12 },
  separator: { height: 18 },
  header: { gap: 18, marginBottom: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 30, color: palette.ink },
  subtitle: { fontFamily: fonts.semibold, fontSize: 13, color: palette.muted },
  segment: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 18,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    backgroundColor: palette.card,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: ui.outlineWidth,
    borderColor: 'transparent',
  },
  segmentActive: { backgroundColor: ui.selected, borderColor: ui.outline },
  segmentText: { fontFamily: fonts.extrabold, fontSize: 15, color: palette.muted },
  segmentTextActive: { color: palette.ink },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { color: palette.muted, fontSize: 15, fontFamily: fonts.semibold, textAlign: 'center' },
});
