import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import EventCard from '../components/events/EventCard';
import { getCategory } from '../data/categories';
import { useEvents } from '../hooks/useEvents';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { colors } from '../theme/colors';
import { addDistance, filterEvents, sortEvents, type SortBy } from '../utils/eventFilters';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

/** Lista de evenimente pentru perioada și categoriile alese pe pagina principală. */
export default function EventsListScreen({ navigation, route }: Props) {
  const { period, categoryIds } = route.params;
  const { events } = useEvents();
  const location = useUserLocation();
  const [sortBy, setSortBy] = useState<SortBy>('date');

  // Titlul de sus = perioada aleasă (ex. „9–15 nov”).
  useLayoutEffect(() => {
    navigation.setOptions({ title: period.label });
  }, [navigation, period.label]);

  const list = useMemo(
    () => sortEvents(filterEvents(addDistance(events, location.coords), period, categoryIds), sortBy),
    [events, location.coords, period, categoryIds, sortBy],
  );

  const categoriesText =
    categoryIds.length === 0 ? 'Toate categoriile' : categoryIds.map((id) => getCategory(id).label).join(', ');

  return (
    <FlatList
      data={list}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.summary} numberOfLines={2}>
            {list.length} {list.length === 1 ? 'eveniment' : 'evenimente'} · {categoriesText}
          </Text>
          {/* Sortare: după dată sau după distanță */}
          <View style={styles.sort}>
            <SortOption label="Dată" icon="calendar-outline" active={sortBy === 'date'} onPress={() => setSortBy('date')} />
            <SortOption
              label="Distanță"
              icon="navigate-outline"
              active={sortBy === 'distance'}
              onPress={() => setSortBy('distance')}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="calendar-clear-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>Niciun eveniment în perioada și categoriile alese.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <EventCard event={item} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} />
      )}
    />
  );
}

function SortOption({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'calendar-outline' | 'navigate-outline';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.sortItem, active && styles.sortItemActive]}>
      <Ionicons name={icon} size={14} color={active ? colors.text : colors.muted} />
      <Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8 },
  separator: { height: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  summary: { flex: 1, fontSize: 13, color: colors.muted, fontWeight: '600' },
  sort: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12, padding: 3 },
  sortItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  sortItemActive: { backgroundColor: colors.card },
  sortText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  sortTextActive: { color: colors.text },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
});
