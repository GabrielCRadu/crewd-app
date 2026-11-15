import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import HeaderLogo from '../components/HeaderLogo';
import { subscribeToEventsScrollTop } from '../navigation/navigationRef';
import ScreenGlow from '../components/ScreenGlow';
import SegmentedControl from '../components/SegmentedControl';
import CategoryChips from '../components/events/CategoryChips';
import JoinedCalendar from '../components/events/JoinedCalendar';
import NowCarousel from '../components/events/NowCarousel';
import UpcomingEventRow from '../components/events/UpcomingEventRow';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { getLocationNotice, useUserLocation } from '../hooks/useUserLocation';
import { useNow } from '../hooks/useNow';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined } from '../services/preferencesService';
import { colors, onThemeChange } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import type { CategoryId } from '../types/events';
import { isLive } from '../utils/dates';
import { addDistance, isUpcomingOrLive, matchesCategories, sortByDate } from '../utils/eventFilters';
import { tr } from '../i18n';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsHome'>;
type Mode = 'all' | 'calendar';

/**
 * Ecranul principal al tab-ului (docs/layout-guide.md → Tab Evenimente):
 * titlu → Toate | Calendarul meu →
 * - Toate: categorii → cardul „ACUM” → „Urmează”;
 * - Calendarul meu: luna cu evenimentele la care ești înscris și programul pe zile (JoinedCalendar).
 * Harta evenimentelor s-a mutat în tab-ul Hartă (modul Evenimente).
 */
export default function EventsScreen({ navigation }: Props) {
  // Logo-ul din bara de sus, apăsat când ești deja aici, duce lista sus (src/navigation/navigationRef.ts).
  const scrollRef = useRef<ScrollViewInstance>(null);
  useEffect(() => subscribeToEventsScrollTop(() => scrollRef.current?.scrollTo({ y: 0, animated: true })), []);
  const location = useUserLocation();
  const { events, loading, error } = useEvents(location.coords);
  const preferences = usePreferences();

  const [mode, setMode] = useState<Mode>('all');
  const [categoryIds, setCategoryIds] = useState<CategoryId[]>([]);

  // Calendarul: toate evenimentele la care ești înscris (și cele trecute, ca să-ți vezi luna), cu distanța.
  const joined = useMemo(
    () => addDistance(events.filter((e) => isJoined(preferences, e.id)), location.coords),
    [events, preferences, location.coords],
  );

  // Ora curentă, la fiecare minut: „ACUM” și „Urmează” se actualizează cât stai pe ecran (audit).
  const now = useNow();
  // Evenimentele încă neterminate, din categoriile alese, cu distanța până la tine, sortate după oră.
  const visible = useMemo(
    () =>
      sortByDate(
        addDistance(events, location.coords).filter((e) => isUpcomingOrLive(e) && matchesCategories(e, categoryIds)),
      ),
    // `now` e în dependențe ca lista să se refacă la fiecare minut (isUpcomingOrLive citește ora curentă).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, location.coords, categoryIds, now],
  );
  // „ACUM” = toate evenimentele în desfășurare (cel mai apropiat primul); restul intră în „Urmează”.
  const liveNow = useMemo(
    () => visible.filter((e) => isLive(e)).sort((a, b) => a.distanceKm - b.distanceKm),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible, now],
  );
  const upcoming = visible.filter((e) => !isLive(e));

  const openEvent = (eventId: string) => navigation.navigate('EventDetails', { eventId });
  const locationNotice = getLocationNotice(location.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Lumina caldă de sus, ca în referințele de design */}
      <ScreenGlow />

      <View style={styles.header}>
        <HeaderLogo label={tr('Evenimente')} />
        <SegmentedControl
          options={[
            { value: 'all', label: tr('Toate') },
            { value: 'calendar', label: tr('Calendarul meu') },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {mode === 'all' ? <CategoryChips selected={categoryIds} onChange={setCategoryIds} /> : null}

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

      {mode === 'calendar' ? (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.text} style={styles.loader} />
          ) : (
            <JoinedCalendar events={joined} onOpenEvent={openEvent} onBrowse={() => setMode('all')} />
          )}
        </ScrollView>
      ) : (
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {liveNow.length > 0 ? (
            <NowCarousel events={liveNow} onOpen={openEvent} />
          ) : null}

          <Text style={styles.sectionTitle}>{tr('Urmează')}</Text>
          {loading ? (
            <ActivityIndicator color={colors.text} style={styles.loader} />
          ) : upcoming.length === 0 ? (
            <Text style={styles.empty}>{tr('Niciun eveniment pentru categoriile alese.')}</Text>
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

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14 },
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
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
