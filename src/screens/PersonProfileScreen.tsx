import { Fragment, useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

import Chip from '../components/Chip';
import FriendButton from '../components/FriendButton';
import GlassIconButton from '../components/GlassIconButton';
import EventHistoryCarousel from '../components/events/EventHistoryCarousel';
import { allProfileTags, useAuth } from '../context/AuthContext';
import { RATING_TAGS } from '../data/ratingTags';
import { useEvents } from '../hooks/useEvents';
import { useFriends } from '../hooks/useFriends';
import { usePastEvents } from '../hooks/usePastEvents';
import { useRatings } from '../hooks/useRatings';
import { useUserLocation } from '../hooks/useUserLocation';
import { blockPerson, idsWithStatus, statusOf, unblockPerson } from '../services/friendsService';
import { commonTags, friendsOfPerson, getPerson, mutualFriends } from '../services/peopleService';
import { getReputation, hasReportedPerson, reportPerson } from '../services/ratingsService';
import { colors } from '../theme/colors';
import { radii } from '../theme/shape';
import { formatEventDate } from '../utils/dates';
import { isUpcomingOrLive, sortByDate } from '../utils/eventFilters';

/**
 * Parametrii ecranului. Profilul unei persoane e înregistrat în mai multe stive
 * (Evenimente, Profil, Chat), toate cu același nume de rută și același parametru.
 */
type PersonProfileParams = { PersonProfile: { personId: string } };

/**
 * Profilul altei persoane. Doar negru, gri și alb (text mare și curat), ca să iasă în evidență
 * pozele de profil și cele de la evenimente.
 * Conținut: identitate, prietenie, „Despre”, ce aveți în comun, ce a strâns după evenimente
 * (totaluri anonime), evenimentele la care ați fost împreună și, doar pentru prieteni, unde merge.
 */
export default function PersonProfileScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const { personId } = useRoute<RouteProp<PersonProfileParams, 'PersonProfile'>>().params;
  const person = getPerson(personId);
  const insets = useSafeAreaInsets();

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
  const personFriends = friendsOfPerson(person.id);
  const mutualCount = mutualFriends(person.id, idsWithStatus(friends, 'friends')).length;
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

  const meta = [`${person.age} ani`, person.city].filter(Boolean).join(' · ');

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Partea de sus, direct pe fundalul negru: butoanele, identitatea și prietenia */}
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
            <GlassIconButton icon="ellipsis-horizontal" onPress={openMenu} />
          </View>

          {/* Identitatea: poza, numele mare, vârsta și orașul */}
          <View style={styles.identity}>
            {/* Poza de profil; fără poză, un pătrat de sticlă cu inițiala */}
            {person.photoUrl ? (
              <Image source={{ uri: person.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photo}>
                <Text style={styles.photoInitial}>{person.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.name}>{person.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={15} color={colors.text} />
              <Text style={styles.meta}>{meta}</Text>
            </View>
            {/* Prietenii ei: apeși și vezi lista (toți sau doar cei comuni) */}
            <Pressable
              onPress={() => navigation.navigate('PersonFriends', { personId: person.id })}
              hitSlop={6}
              style={({ pressed }) => [styles.friendsLink, pressed && styles.pressed]}
            >
              <Ionicons name="people-outline" size={15} color={colors.text} />
              <Text style={styles.friendsLinkText}>
                {personFriends.length} {personFriends.length === 1 ? 'prieten' : 'prieteni'}
                <Text style={styles.friendsLinkMuted}> · {mutualCount} comuni</Text>
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.muted} />
            </Pressable>
          </View>

          <FriendButton personId={person.id} name={person.name} status={status} />
        </View>

        {/* Restul paginii */}
        <View style={styles.content}>
          {blocked ? (
            <Text style={styles.muted}>
              Ai blocat această persoană. Nu te mai poate adăuga și nu vă vedeți activitatea.
            </Text>
          ) : (
            <>
              {/* Despre */}
              {person.bio ? (
                <View style={styles.section}>
                  <Text style={styles.label}>DESPRE</Text>
                  <View style={styles.card}>
                    <Text style={styles.bio}>{person.bio}</Text>
                  </View>
                </View>
              ) : null}

              {/* Ce aveți în comun: tag-urile comune albe, restul estompate */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  ÎN COMUN · {shared.length === 0 ? 'NICIUN TAG' : shared.length === 1 ? '1 TAG' : `${shared.length} TAG-URI`}
                </Text>
                <View style={styles.tags}>
                  {shared.map((t) => (
                    <Chip key={t} label={t} active />
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
                <Text style={styles.label}>DUPĂ EVENIMENTE</Text>
                {/* Un singur card: trei tag-uri primite + rapoartele, despărțite de linii subțiri */}
                <View style={[styles.card, styles.statsCard]}>
                  {[
                    ...RATING_TAGS.map((t) => ({
                      key: t.id,
                      value: reputation.tagCounts[t.id],
                      label: t.id === 'again' ? 'Aș mai ieși' : t.label,
                      alert: false,
                    })),
                    { key: 'reports', value: reputation.reportsCount, label: 'Rapoarte', alert: reputation.reportsCount > 0 },
                  ].map((s, i) => (
                    <Fragment key={s.key}>
                      {i > 0 ? <View style={styles.statDivider} /> : null}
                      <View style={styles.stat}>
                        <Text style={[styles.statValue, s.alert && styles.reports]}>{s.value}</Text>
                        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          {s.label}
                        </Text>
                      </View>
                    </Fragment>
                  ))}
                </View>
                <Text style={styles.muted}>Anonim: se văd doar totalurile.</Text>
              </View>

              {/* Ați fost împreună la… */}
              {together.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.label}>AȚI FOST ÎMPREUNĂ LA</Text>
                  <EventHistoryCarousel events={together} onOpen={openEvent} />
                </View>
              ) : null}

              {/* Merge la… (doar prietenii văd) */}
              <View style={styles.section}>
                <Text style={styles.label}>MERGE LA</Text>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  flex: { flex: 1 },
  top: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  content: { padding: 20, paddingTop: 28, paddingBottom: 40, gap: 28 },
  identity: { gap: 10 },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoInitial: { fontSize: 40, fontWeight: '700', color: colors.text },
  name: { fontSize: 46, lineHeight: 50, fontWeight: '800', letterSpacing: -1.5, color: colors.text, marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 15, fontWeight: '500', color: colors.text },
  friendsLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  friendsLinkText: { fontSize: 15, fontWeight: '600', color: colors.text },
  friendsLinkMuted: { fontWeight: '500', color: colors.muted },
  section: { gap: 12 },
  // Etichete mici, cu majuscule și spațiere: aspect editorial, sobru.
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6, color: colors.muted },
  // Carduri neutre (gri închis, contur fin): culoarea o dau pozele, nu interfața.
  card: {
    padding: 18,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  bio: { fontSize: 16, lineHeight: 24, color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faded: { opacity: 0.4 },
  statsCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  reports: { color: colors.nope },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.inner,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.75 },
  muted: { fontSize: 13, color: colors.muted },
});
