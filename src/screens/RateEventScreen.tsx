import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import GradientButton from '../components/GradientButton';
import ScreenGlow from '../components/ScreenGlow';
import RatingTagToggle from '../components/events/RatingTagToggle';
import { RATING_TAGS } from '../data/ratingTags';
import { useEvents } from '../hooks/useEvents';
import { useRatings } from '../hooks/useRatings';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { getCompanions, saveEventRatings } from '../services/ratingsService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { EventRatings, PersonRating, RatingTag } from '../types/ratings';
import type { Person } from '../types/social';
import { formatLongDay } from '../utils/dates';

type Props = NativeStackScreenProps<EventsStackParamList, 'RateEvent'>;

const EMPTY: PersonRating = { tags: [], reported: false };

/**
 * „Cum a fost?”: după un eveniment, dai tag-uri oamenilor cu care ai fost
 * (De treabă, Punctual, Aș mai ieși cu el/ea) sau îi raportezi, anonim.
 */
export default function RateEventScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const location = useUserLocation();
  const { events, loading } = useEvents(location.coords);
  const myRatings = useRatings();
  const insets = useSafeAreaInsets();

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId]);
  // Pornim de la ce ai dat deja (dacă revii să modifici).
  const [draft, setDraft] = useState<EventRatings>(() => myRatings[eventId] ?? {});

  if (!event) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.muted}>Evenimentul nu a fost găsit.</Text>}
      </View>
    );
  }

  const companions = getCompanions(event);
  const ratingOf = (personId: string) => draft[personId] ?? EMPTY;
  const setRating = (personId: string, rating: PersonRating) => setDraft((prev) => ({ ...prev, [personId]: rating }));

  const toggleTag = (personId: string, tag: RatingTag) => {
    const current = ratingOf(personId);
    const tags = current.tags.includes(tag) ? current.tags.filter((t) => t !== tag) : [...current.tags, tag];
    setRating(personId, { ...current, tags });
  };

  // Raportul cere confirmare și șterge tag-urile pozitive date aceleiași persoane.
  const report = (person: Person) => {
    Alert.alert(
      `Raportezi pe ${person.name}?`,
      'Persoana nu va afla cine a raportat-o. Pe profilul ei apare doar numărul total de rapoarte.',
      [
        { text: 'Renunță', style: 'cancel' },
        { text: 'Raportează', style: 'destructive', onPress: () => setRating(person.id, { tags: [], reported: true }) },
      ],
    );
  };

  const submit = async () => {
    // Păstrăm doar persoanele cărora le-ai dat ceva.
    const given = Object.fromEntries(
      Object.entries(draft).filter(([, r]) => r.reported || r.tags.length > 0),
    );
    await saveEventRatings(event.id, given);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenGlow />

      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Cum a fost?</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {event.title} · {formatLongDay(event.startsAt)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.text} />
          <Text style={styles.noticeText}>
            Evaluările sunt anonime: nimeni nu află cine ce a dat. Pe profiluri apar doar totalurile.
          </Text>
        </View>

        {companions.length === 0 ? (
          <Text style={styles.muted}>Nu ai pe cine evalua la acest eveniment.</Text>
        ) : (
          companions.map((person) => {
            const rating = ratingOf(person.id);
            return (
              <View key={person.id} style={[styles.personCard, rating.reported && styles.personCardReported]}>
                <Pressable
                  onPress={() => navigation.navigate('PersonProfile', { personId: person.id })}
                  style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                >
                  <Avatar name={person.name} size={44} photoUrl={person.photoUrl} />
                  <View style={styles.personText}>
                    <Text style={styles.personName}>{person.name}</Text>
                    <Text style={styles.muted}>Vezi profilul</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.faint} />
                </Pressable>

                {rating.reported ? (
                  <View style={styles.reportedRow}>
                    <Ionicons name="flag" size={15} color={colors.nope} />
                    <Text style={styles.reportedText}>Raportat · anonim</Text>
                    <Pressable onPress={() => setRating(person.id, EMPTY)} hitSlop={8}>
                      <Text style={styles.link}>Anulează raportul</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.tags}>
                      {RATING_TAGS.map((tag) => (
                        <RatingTagToggle
                          key={tag.id}
                          tag={tag}
                          selected={rating.tags.includes(tag.id)}
                          onPress={() => toggleTag(person.id, tag.id)}
                        />
                      ))}
                    </View>
                    <Pressable onPress={() => report(person)} hitSlop={8} style={styles.reportButton}>
                      <Ionicons name="flag-outline" size={14} color={colors.muted} />
                      <Text style={styles.reportText}>Nu a fost ok? Raportează</Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <GradientButton label="Trimite evaluarea" icon="checkmark" onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 12 },
  notice: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.inner,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  personCard: { ...glass, gap: 12, padding: 14, borderRadius: radii.card },
  personCardReported: { borderColor: colors.nope },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radii.inner },
  pressed: { opacity: 0.7 },
  personText: { flex: 1, gap: 2 },
  personName: { fontSize: 17, fontWeight: '600', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reportButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  reportText: { fontSize: 13, color: colors.muted },
  reportedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportedText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.nope },
  link: { fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
