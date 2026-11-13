import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenHeader from '../components/ScreenHeader';
import CategoryChips from '../components/events/CategoryChips';
import EventsMap from '../components/events/EventsMap';
import PeriodPicker from '../components/events/PeriodPicker';
import RecommendedEvents from '../components/events/RecommendedEvents';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { getLocationNotice, useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { getRecommendedEvents } from '../services/preferencesService';
import { colors } from '../theme/colors';
import type { CategoryId, Period } from '../types/events';
import { getCurrentWeekPeriod } from '../utils/dates';
import { addDistance, filterEvents, isUpcomingOrLive } from '../utils/eventFilters';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsHome'>;

/** Pagina principală a tab-ului: perioadă → categorii → hartă → „Vezi toate” → recomandări. */
export default function EventsScreen({ navigation }: Props) {
  const { events, loading } = useEvents();
  const location = useUserLocation();
  const preferences = usePreferences();
  const { width } = useWindowDimensions();

  // Filtrele alese de utilizator. Implicit: săptămâna curentă, toate categoriile.
  const [period, setPeriod] = useState<Period>(() => getCurrentWeekPeriod());
  const [categoryIds, setCategoryIds] = useState<CategoryId[]>([]);

  // useMemo = recalculăm doar când se schimbă ce e în listă (nu la fiecare re-desenare).
  const withDistance = useMemo(() => addDistance(events, location.coords), [events, location.coords]);
  const filtered = useMemo(
    () => filterEvents(withDistance, period, categoryIds),
    [withDistance, period, categoryIds],
  );
  const recommended = useMemo(
    () => getRecommendedEvents(withDistance.filter((e) => isUpcomingOrLive(e)), preferences),
    [withDistance, preferences],
  );

  const openEvent = (eventId: string) => navigation.navigate('EventDetails', { eventId });
  const locationNotice = getLocationNotice(location.status);
  // Harta se adaptează la lățimea ecranului (telefoane mici / mari).
  const mapHeight = Math.min(420, Math.max(280, width * 0.85));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Evenimente" subtitle="Găsește unde să mergi, și cu cine" />

        {locationNotice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            <Text style={styles.noticeText}>{locationNotice}</Text>
          </View>
        ) : null}

        {/* a) Perioada */}
        <Text style={styles.sectionTitle}>Când?</Text>
        <PeriodPicker value={period} onChange={setPeriod} />

        {/* b) Categoria */}
        <Text style={styles.sectionTitle}>Ce îți place?</Text>
        <CategoryChips selected={categoryIds} onChange={setCategoryIds} />

        {/* c) Harta */}
        <View style={styles.mapHeader}>
          <Text style={[styles.sectionTitle, styles.inlineTitle]}>Pe hartă</Text>
          {loading || location.status === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
        <EventsMap
          events={filtered}
          userLocation={location.coords}
          showUserLocation={location.status === 'granted'}
          height={mapHeight}
          onOpenEvent={openEvent}
        />

        {/* d) Vezi toate */}
        <Pressable
          onPress={() => navigation.navigate('EventsList', { period, categoryIds })}
          style={({ pressed }) => [styles.allButton, pressed && styles.pressed]}
        >
          <Text style={styles.allButtonText}>Vezi toate evenimentele ({filtered.length})</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        {/* Recomandate, pe baza scorurilor din preferințe */}
        {recommended.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recomandate pentru tine</Text>
            <RecommendedEvents events={recommended} onOpenEvent={openEvent} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  noticeText: { flex: 1, fontSize: 12, color: colors.muted },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 20 },
  inlineTitle: { marginRight: 0 },
  allButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  allButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
