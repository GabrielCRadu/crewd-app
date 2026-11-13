import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import FriendButton from '../components/FriendButton';
import GlassIconButton from '../components/GlassIconButton';
import ReputationStats from '../components/ReputationStats';
import TintedCard from '../components/TintedCard';
import EventHistoryCarousel from '../components/events/EventHistoryCarousel';
import { allProfileTags, useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useFriends } from '../hooks/useFriends';
import { usePastEvents } from '../hooks/usePastEvents';
import { useRatings } from '../hooks/useRatings';
import { useUserLocation } from '../hooks/useUserLocation';
import { blockPerson, statusOf, unblockPerson } from '../services/friendsService';
import { commonTags, getPerson } from '../services/peopleService';
import { getReputation, hasReportedPerson, reportPerson } from '../services/ratingsService';
import { colors, tagTints } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { glass, radii } from '../theme/shape';
import { formatEventDate } from '../utils/dates';
import { isUpcomingOrLive, sortByDate } from '../utils/eventFilters';

/**
 * Parametrii ecranului. Profilul unei persoane e înregistrat în mai multe stive
 * (Evenimente, Profil, Chat), toate cu același nume de rută și același parametru.
 */
type PersonProfileParams = { PersonProfile: { personId: string } };

/**
 * Profilul altei persoane, arătând ca profilul tău: identitate, butonul de prietenie,
 * „Despre”, ce aveți în comun, ce a strâns după evenimente (doar totaluri, anonim),
 * evenimentele la care ați fost împreună și, doar pentru prieteni, unde merge.
 */
export default function PersonProfileScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const { personId } = useRoute<RouteProp<PersonProfileParams, 'PersonProfile'>>().params;
  const person = getPerson(personId);

  const { profile } = useAuth();
  const myRatings = useRatings();
  const friends = useFriends();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const myPastEvents = usePastEvents();

  const myTags = useMemo(() => allProfileTags(profile), [profile]);
  const name = person?.name ?? '';
  // Ați fost împreună: evenimentele din istoricul tău la care a fost și ea/el.
  const together = useMemo(() => myPastEvents.filter((e) => e.friendsGoing.includes(name)), [myPastEvents, name]);
  // Merge la: evenimentele viitoare la care e înscrisă/înscris (vizibile doar prietenilor).
  const goingTo = useMemo(
    () => sortByDate(events.filter((e) => isUpcomingOrLive(e) && e.friendsGoing.includes(name))),
    [events, name],
  );

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Persoana nu a fost găsită.</Text>
      </View>
    );
  }

  const status = statusOf(friends, person.id);
  const isFriend = status === 'friends';
  const blocked = status === 'blocked';
  const reputation = getReputation(myRatings, person.id);
  const shared = commonTags(person, myTags);
  const others = person.tags.filter((t) => !shared.includes(t));

  // Evenimentele se deschid în tab-ul Evenimente, cu lista dedesubt pentru „înapoi”.
  const openEvent = (eventId: string) =>
    navigation.getParent()?.navigate('Events', { screen: 'EventDetails', params: { eventId }, initial: false });

  const confirmReport = () => {
    if (hasReportedPerson(myRatings, person.id)) {
      Alert.alert('Ai raportat deja această persoană', 'Raportul tău a fost înregistrat, anonim.');
      return;
    }
    Alert.alert(
      `Raportezi pe ${person.name}?`,
      'Persoana nu va afla cine a raportat-o. Pe profilul ei apare doar numărul total de rapoarte.',
      [
        { text: 'Renunță', style: 'cancel' },
        { text: 'Raportează', style: 'destructive', onPress: () => void reportPerson(person.id) },
      ],
    );
  };

  const confirmBlock = () =>
    Alert.alert(
      `Blochezi pe ${person.name}?`,
      'Prietenia și cererile se șterg, iar persoana nu te mai poate adăuga. Nu află că ai blocat-o.',
      [
        { text: 'Renunță', style: 'cancel' },
        { text: 'Blochează', style: 'destructive', onPress: () => void blockPerson(person.id) },
      ],
    );

  // Meniul ⋯: Raportează / Blochează (sau Deblochează).
  const openMenu = () =>
    Alert.alert(person.name, undefined, [
      { text: 'Raportează', onPress: confirmReport },
      blocked
        ? { text: 'Deblochează', onPress: () => void unblockPerson(person.id) }
        : { text: 'Blochează', style: 'destructive', onPress: confirmBlock },
      { text: 'Renunță', style: 'cancel' },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <GlassIconButton icon="ellipsis-horizontal" onPress={openMenu} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identitatea */}
        <View style={styles.identity}>
          <Aurora style={StyleSheet.absoluteFill} />
          <View style={styles.identityRow}>
            <Avatar name={person.name} size={84} square />
            <View style={styles.identityText}>
              <Text style={styles.name}>
                {person.name}, {person.age}
              </Text>
              {person.city ? (
                <View style={styles.cityRow}>
                  <Ionicons name="location-outline" size={16} color={colors.text} />
                  <Text style={styles.city}>{person.city}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <FriendButton personId={person.id} name={person.name} status={status} />

        {blocked ? (
          <Text style={styles.muted}>Ai blocat această persoană. Nu te mai poate adăuga și nu vă vedeți activitatea.</Text>
        ) : (
          <>
            {/* Despre */}
            {person.bio ? (
              <TintedCard tint={gradients.tintWarm} style={styles.aboutCard}>
                <Text style={styles.cardTitle}>Despre</Text>
                <Text style={styles.bio}>{person.bio}</Text>
              </TintedCard>
            ) : null}

            {/* Ce aveți în comun: tag-urile comune colorate, restul estompate */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ce aveți în comun</Text>
              <Text style={styles.muted}>
                {shared.length === 0
                  ? 'Niciun tag comun încă.'
                  : `${shared.length} ${shared.length === 1 ? 'tag comun' : 'tag-uri comune'}: ${shared.join(', ')}`}
              </Text>
              <View style={styles.tags}>
                {shared.map((t) => (
                  <Chip key={t} label={t} tint={tagTints.pink} />
                ))}
                {others.map((t) => (
                  <View key={t} style={styles.faded}>
                    <Chip label={t} />
                  </View>
                ))}
              </View>
            </View>

            {/* După evenimente: totaluri anonime */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>După evenimente</Text>
              <ReputationStats reputation={reputation} />
              <View style={styles.reportsRow}>
                <Ionicons
                  name={reputation.reportsCount > 0 ? 'flag' : 'flag-outline'}
                  size={18}
                  color={reputation.reportsCount > 0 ? colors.nope : colors.muted}
                />
                <Text style={styles.reportsLabel}>Rapoarte</Text>
                <Text style={[styles.reportsValue, reputation.reportsCount > 0 && styles.reports]}>
                  {reputation.reportsCount}
                </Text>
              </View>
              <Text style={styles.muted}>Evaluările sunt anonime: se văd doar totalurile.</Text>
            </View>

            {/* Ați fost împreună la… */}
            {together.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ați fost împreună la</Text>
                <EventHistoryCarousel events={together} onOpen={openEvent} />
              </View>
            ) : null}

            {/* Merge la… (doar prietenii văd) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Merge la</Text>
              {!isFriend ? (
                <View style={styles.lockedRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.muted} />
                  <Text style={[styles.muted, styles.flex]}>Doar prietenii văd la ce evenimente merge.</Text>
                </View>
              ) : goingTo.length === 0 ? (
                <Text style={styles.muted}>Nu e înscris(ă) la niciun eveniment acum.</Text>
              ) : (
                goingTo.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => openEvent(e.id)}
                    style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {e.title}
                      </Text>
                      <Text style={styles.muted}>{formatEventDate(e.startsAt)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.faint} />
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 22 },
  identity: { ...glass, borderRadius: radii.card, overflow: 'hidden' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  identityText: { flex: 1, gap: 6 },
  name: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { color: colors.text, fontSize: 15, opacity: 0.85 },
  aboutCard: { gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  bio: { fontSize: 15, lineHeight: 22, color: colors.text },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faded: { opacity: 0.4 },
  reportsRow: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.inner,
  },
  reportsLabel: { flex: 1, fontSize: 15, color: colors.text },
  reportsValue: { fontSize: 17, fontWeight: '600', color: colors.text },
  reports: { color: colors.nope },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventRow: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.inner,
  },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  pressed: { backgroundColor: colors.cardStrong },
  muted: { fontSize: 13, color: colors.muted },
});
