import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import CategoryChips from '../components/events/CategoryChips';
import EventsMap from '../components/events/EventsMap';
import LiveNowCard from '../components/events/LiveNowCard';
import PeriodPicker from '../components/events/PeriodPicker';
import Raised from '../components/events/Raised';
import RecommendedEvents from '../components/events/RecommendedEvents';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { getLocationNotice, useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { getRecommendedEvents, isJoined, joinEvent } from '../services/preferencesService';
import { fonts, palette, ui } from '../theme/eventsTheme';
import type { CategoryId, Period } from '../types/events';
import { getCurrentWeekPeriod, isLive } from '../utils/dates';
import { addDistance, filterEvents, isUpcomingOrLive } from '../utils/eventFilters';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsHome'>;

/** Pagina principală a tab-ului: ACUM → perioadă → categorii → hartă → „Vezi toate” → recomandări. */
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
  // Cel mai apropiat eveniment care are loc chiar acum (pentru cardul „ACUM”).
  const liveNow = useMemo(
    () => withDistance.filter((e) => isLive(e)).sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null,
    [withDistance],
  );

  const openEvent = (eventId: string) => navigation.navigate('EventDetails', { eventId });
  const locationNotice = getLocationNotice(location.status);
  // Harta se adaptează la lățimea ecranului (telefoane mici / mari).
  const mapHeight = Math.min(420, Math.max(280, width * 0.85));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Evenimente</Text>
          {loading || location.status === 'loading' ? <ActivityIndicator color={palette.ink} /> : null}
        </View>

        {locationNotice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={16} color={palette.muted} />
            <Text style={styles.noticeText}>{locationNotice}</Text>
          </View>
        ) : null}

        {/* Cardul „ACUM” */}
        {liveNow ? (
          <LiveNowCard
            event={liveNow}
            joined={isJoined(preferences, liveNow.id)}
            onJoin={() => joinEvent(liveNow)}
            onOpen={() => openEvent(liveNow.id)}
          />
        ) : null}

        {/* a) Perioada */}
        <Text style={styles.sectionTitle}>Când?</Text>
        <PeriodPicker value={period} onChange={setPeriod} />

        {/* b) Categoria */}
        <Text style={styles.sectionTitle}>Ce îți place?</Text>
        <CategoryChips selected={categoryIds} onChange={setCategoryIds} />

        {/* c) Harta */}
        <Text style={styles.sectionTitle}>Pe hartă</Text>
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
          <Raised color={ui.cta} radius={22} contentStyle={styles.allButtonInner}>
            <Text style={styles.allButtonText}>Vezi toate evenimentele ({filtered.length})</Text>
            <Ionicons name="arrow-forward" size={20} color={palette.ink} />
          </Raised>
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
  safe: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { fontFamily: fonts.display, fontSize: 38, color: palette.ink, letterSpacing: -0.5 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    backgroundColor: palette.card,
  },
  noticeText: { flex: 1, fontSize: 12, fontFamily: fonts.semibold, color: palette.muted },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.ink,
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
  },
  allButton: { marginHorizontal: 20, marginTop: 18 },
  allButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  allButtonText: { color: palette.ink, fontSize: 17, fontFamily: fonts.display },
  pressed: { opacity: 0.85 },
});
