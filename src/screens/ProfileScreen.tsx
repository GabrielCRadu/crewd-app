import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import AboutCard from '../components/AboutCard';
import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import ReputationStats from '../components/ReputationStats';
import ScreenGlow from '../components/ScreenGlow';
import EventHistoryCarousel from '../components/events/EventHistoryCarousel';
import { ME_ID } from '../data/mockRatings';
import { FRIENDS, MY_GROUPS, MY_PROFILE } from '../data/mockSocial';
import { TAG_GROUPS } from '../data/tags';
import { usePastEvents } from '../hooks/usePastEvents';
import { useRatings } from '../hooks/useRatings';
import { getReputation } from '../services/ratingsService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { IconName } from '../types/events';
import type { TagGroup } from '../types/social';

/** Iconița fiecărui grup de tag-uri din cardul „Ce îți place”. */
const GROUP_ICONS: Record<TagGroup['id'], IconName> = {
  events: 'ticket-outline',
  music: 'musical-notes-outline',
  hobbies: 'color-palette-outline',
};

/**
 * Tab-ul Profil (vezi docs/layout-guide.md): identitate cu statistici, „Despre mine”,
 * ce spun alții despre tine, ce îți place, tag-uri învățate și istoricul (privat).
 */
export default function ProfileScreen() {
  const profile = MY_PROFILE;
  const [bio, setBio] = useState(profile.bio);
  const [learned, setLearned] = useState(profile.learnedTags);
  const pastEvents = usePastEvents();
  const reputation = getReputation(useRatings(), ME_ID);

  const navigation = useNavigation<BottomTabNavigationProp<Record<string, object | undefined>>>();
  // Detaliile sunt în tab-ul Evenimente; `initial: false` lasă lista dedesubt, pentru „înapoi”.
  const openPastEvent = (eventId: string) =>
    navigation.navigate('Events', { screen: 'EventDetails', params: { eventId }, initial: false });

  const stats = [
    { value: FRIENDS.length, label: 'prieteni' },
    { value: MY_GROUPS.length, label: 'grupuri' },
    { value: pastEvents.length, label: 'evenimente' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenGlow />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Text style={styles.editText}>Editează</Text>
          </Pressable>
        </View>

        {/* Identitatea + rândul de statistici */}
        <View style={styles.identity}>
          <Aurora style={StyleSheet.absoluteFill} />
          <View style={styles.identityRow}>
            <Avatar name={profile.name} size={84} square />
            <View style={styles.identityText}>
              <Text style={styles.name}>
                {profile.name}, {profile.age}
              </Text>
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={16} color={colors.text} />
                <Text style={styles.city}>{profile.city}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <Fragment key={s.label}>
                {i > 0 ? <View style={styles.statDivider} /> : null}
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </Fragment>
            ))}
          </View>
        </View>

        <AboutCard bio={bio} onSave={setBio} />

        {/* Totalurile primite după evenimente (anonime) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ce spun alții despre tine</Text>
          <ReputationStats reputation={reputation} />
        </View>

        {/* Tag-urile alese, într-un singur card, pe grupuri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ce îți place</Text>
          <View style={styles.card}>
            {TAG_GROUPS.map((group, i) => (
              <View key={group.id} style={[styles.tagGroup, i > 0 && styles.tagGroupDivided]}>
                <View style={styles.tagGroupHeader}>
                  <Ionicons name={GROUP_ICONS[group.id]} size={16} color={colors.muted} />
                  <Text style={styles.tagGroupLabel}>{group.label}</Text>
                </View>
                <View style={styles.tags}>
                  {profile.chosenTags[group.id].map((t) => (
                    <Chip key={t} label={t} active />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, styles.learnedCard]}>
          <Text style={styles.cardTitle}>Învățate din evenimentele tale</Text>
          <Text style={styles.hint}>Tag-uri adăugate automat după înscrieri. Le poți scoate oricând.</Text>
          <View style={styles.tags}>
            {learned.map((t) => (
              <Chip key={t} label={t} dashed onRemove={() => setLearned((prev) => prev.filter((x) => x !== t))} />
            ))}
            {learned.length === 0 ? <Text style={styles.hint}>Niciun tag învățat încă.</Text> : null}
          </View>
        </View>

        {/* Istoricul (privat): evenimentele trecute apar automat; o carte deschide detaliile, de unde evaluezi */}
        <View style={styles.section}>
          <View>
            <Text style={styles.sectionTitle}>Istoricul tău</Text>
            <View style={styles.privateRow}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.muted} />
              <Text style={styles.hint}>Doar tu vezi această listă.</Text>
            </View>
          </View>
          <EventHistoryCarousel events={pastEvents} onOpen={openPastEvent} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  editButton: { ...glass, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill },
  editText: { color: colors.text, fontWeight: '500' },
  pressed: { backgroundColor: colors.cardStrong },
  identity: { ...glass, borderRadius: radii.card, overflow: 'hidden' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  identityText: { flex: 1, gap: 6 },
  name: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { color: colors.text, fontSize: 15, opacity: 0.85 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: radii.inner,
    backgroundColor: colors.cardStrong,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '600', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  card: { ...glass, padding: 18, borderRadius: radii.card },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  tagGroup: { gap: 10 },
  tagGroupDivided: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  tagGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagGroupLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  learnedCard: { gap: 10 },
  hint: { fontSize: 13, color: colors.muted },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
