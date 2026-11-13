import { Fragment } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AboutCard from '../components/AboutCard';
import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import ReputationStats from '../components/ReputationStats';
import GradientBorderCard from '../components/GradientBorderCard';
import EventHistoryCarousel from '../components/events/EventHistoryCarousel';
import { useAuth } from '../context/AuthContext';
import { ME_ID } from '../data/mockRatings';
import { FRIENDS } from '../data/mockSocial';
import { useMyGroups } from '../hooks/useMyGroups';
import { TAG_GROUPS } from '../data/tags';
import { usePastEvents } from '../hooks/usePastEvents';
import { useRatings } from '../hooks/useRatings';
import { getReputation } from '../services/ratingsService';
import { TAG_GROUP_STYLE as GROUP_STYLE } from '../data/tagGroupStyle';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import { colors, tagTints } from '../theme/colors';
import { glass, radii } from '../theme/shape';

/**
 * Tab-ul Profil (vezi docs/layout-guide.md): identitate cu statistici, „Despre mine”,
 * ce spun alții despre tine, ce îți place, tag-uri învățate, istoricul (privat) și contul.
 * Datele vin din profilul utilizatorului logat (AuthContext → Firestore users/{uid}).
 */
export default function ProfileScreen() {
  const { profile, user, updateBio, removeLearnedTag, signOut } = useAuth();
  const pastEvents = usePastEvents();
  const { groups: myGroups } = useMyGroups();
  // Reputația e încă mock (ratingsService); cu Firebase va fi pe uid-ul din Auth.
  const reputation = getReputation(useRatings(), ME_ID);

  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>>();
  // Detaliile sunt în tab-ul Evenimente; `initial: false` lasă lista dedesubt, pentru „înapoi”.
  const openPastEvent = (eventId: string) =>
    navigation
      .getParent<BottomTabNavigationProp<Record<string, object | undefined>>>()
      ?.navigate('Events', { screen: 'EventDetails', params: { eventId }, initial: false });

  // Tab-urile apar doar cu profil încărcat (RootNavigator), deci aici profile există.
  if (!profile) return null;

  const stats = [
    { value: FRIENDS.length, label: 'prieteni' },
    { value: myGroups.length, label: 'grupuri' },
    { value: pastEvents.length, label: 'evenimente' },
  ];

  const saveBio = (bio: string) => {
    updateBio(bio).catch(() => Alert.alert('Nu am putut salva', 'Verifică conexiunea și încearcă din nou.'));
  };

  const confirmSignOut = () =>
    Alert.alert('Ieși din cont?', 'Te poți loga din nou oricând cu emailul și parola.', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Ieși', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    // Fundal complet negru; culoarea apare doar în câteva carduri (identitate, „Despre mine”, conturul „Ce îți place”).
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Text style={styles.editText}>Editează</Text>
          </Pressable>
        </View>

        {/* Identitatea + rândul de statistici */}
        <View style={styles.identity}>
          <Aurora style={StyleSheet.absoluteFill} />
          <View style={styles.identityRow}>
            <Avatar name={profile.name} size={84} square photoUrl={profile.photoUrl} />
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

        <AboutCard bio={profile.bio} onSave={saveBio} />

        {/* Totalurile primite după evenimente (anonime) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ce spun alții despre tine</Text>
          <ReputationStats reputation={reputation} />
        </View>

        {/* Tag-urile alese, într-un singur card, pe grupuri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ce îți place</Text>
          <GradientBorderCard>
            {TAG_GROUPS.map((group, i) => (
              <View key={group.id} style={[styles.tagGroup, i > 0 && styles.tagGroupDivided]}>
                <View style={styles.tagGroupHeader}>
                  <Ionicons name={GROUP_STYLE[group.id].icon} size={16} color={colors.text} />
                  <Text style={styles.tagGroupLabel}>{group.label}</Text>
                </View>
                <View style={styles.tags}>
                  {profile.chosenTags[group.id].map((t) => (
                    <Chip key={t} label={t} tint={tagTints[GROUP_STYLE[group.id].tint]} />
                  ))}
                  {profile.chosenTags[group.id].length === 0 ? <Text style={styles.hint}>Nimic ales încă.</Text> : null}
                </View>
              </View>
            ))}
          </GradientBorderCard>
        </View>

        <View style={[styles.card, styles.learnedCard]}>
          <Text style={styles.cardTitle}>Învățate din evenimentele tale</Text>
          <Text style={styles.hint}>Tag-uri adăugate automat după înscrieri. Le poți scoate oricând.</Text>
          <View style={styles.tags}>
            {profile.learnedTags.map((t) => (
              <Chip key={t} label={t} dashed onRemove={() => void removeLearnedTag(t)} />
            ))}
            {profile.learnedTags.length === 0 ? <Text style={styles.hint}>Niciun tag învățat încă.</Text> : null}
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

        {/* Contul: emailul și ieșirea */}
        <View style={styles.accountCard}>
          {user?.email ? <Text style={styles.accountEmail}>{user.email}</Text> : null}
          <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
            <Text style={styles.signOutText}>Ieși din cont</Text>
          </Pressable>
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
  tagGroupLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  learnedCard: { gap: 10 },
  hint: { fontSize: 13, color: colors.muted },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  accountCard: { alignItems: 'center', gap: 12, marginTop: 8 },
  accountEmail: { color: colors.faint, fontSize: 13 },
  signOutButton: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  signOutText: { color: colors.text, fontWeight: '500' },
});
