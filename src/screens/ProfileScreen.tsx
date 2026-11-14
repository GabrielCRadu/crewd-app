import { Fragment, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AboutCard from '../components/AboutCard';
import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import PhotoViewer from '../components/PhotoViewer';
import DeleteAccount from '../components/DeleteAccount';
import ReputationStats from '../components/ReputationStats';
import BadgesCard from '../components/badges/BadgesCard';
import GradientBorderCard from '../components/GradientBorderCard';
import EventHistoryCarousel from '../components/events/EventHistoryCarousel';
import AddMemorySheet from '../components/memories/AddMemorySheet';
import MemoriesGrid from '../components/memories/MemoriesGrid';
import MemoryViewer from '../components/memories/MemoryViewer';
import { useAuth } from '../context/AuthContext';
import { ME_ID } from '../data/mockRatings';
import { useMyGroups } from '../hooks/useMyGroups';
import { TAG_GROUPS } from '../data/tags';
import { useFriends } from '../hooks/useFriends';
import { useMemories } from '../hooks/useMemories';
import { usePastEvents } from '../hooks/usePastEvents';
import { useRatings } from '../hooks/useRatings';
import { getMyVotedBadges } from '../services/badgesService';
import { idsWithStatus } from '../services/friendsService';
import { myMemories } from '../services/memoriesService';
import { getReputation } from '../services/ratingsService';
import { TAG_GROUP_STYLE as GROUP_STYLE } from '../data/tagGroupStyle';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import { colors, tagTints } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import { autoBadgeProgress } from '../utils/badgeRules';
import { sortMemories } from '../utils/memoryRules';

/**
 * Tab-ul Profil (vezi docs/layout-guide.md): identitate cu statistici, „Despre mine”,
 * ce spun alții despre tine, ce îți place, tag-uri învățate, istoricul (privat) și contul.
 * Datele vin din profilul utilizatorului logat (AuthContext → Firestore users/{uid}).
 */
export default function ProfileScreen() {
  const { profile, user, updateBio, removeLearnedTag, signOut } = useAuth();
  const pastEvents = usePastEvents();
  const friends = useFriends();
  const { groups: myGroups } = useMyGroups();
  // Reputația e încă mock (ratingsService); cu Firebase va fi pe uid-ul din Auth.
  const reputation = getReputation(useRatings(), ME_ID);
  // Amintiri: pozele tale de la evenimentele trecute (încă doar în memorie, memoriesService).
  const memories = sortMemories(myMemories(useMemories()));
  // Foaia „Adaugă amintire”: închisă, deschisă fără eveniment ales, sau pentru un eveniment anume.
  const [addMemory, setAddMemory] = useState<{ eventId: string | null } | null>(null);
  const [openMemoryId, setOpenMemoryId] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  // Badge-uri: cele votate sunt încă mock (badgesService); cele automate vin din istoricul tău.
  const badgeProgress = autoBadgeProgress(pastEvents);

  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>>();
  // Detaliile sunt în tab-ul Evenimente; `initial: false` lasă lista dedesubt, pentru „înapoi”.
  const openPastEvent = (eventId: string) =>
    navigation
      .getParent<BottomTabNavigationProp<Record<string, object | undefined>>>()
      ?.navigate('Events', { screen: 'EventDetails', params: { eventId }, initial: false });

  // Tab-urile apar doar cu profil încărcat (RootNavigator), deci aici profile există.
  if (!profile) return null;

  // „prieteni” deschide lista de prieteni; badge-ul arată câte cereri noi ai primit.
  const incomingCount = idsWithStatus(friends, 'incoming').length;
  const stats = [
    { value: idsWithStatus(friends, 'friends').length, label: 'prieteni', onPress: () => navigation.navigate('FriendsList'), badge: incomingCount },
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
      {/* „Despre mine” se editează direct aici: tastatura nu trebuie să acopere câmpul (edge-to-edge pe Android) */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
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
            <Pressable
              onPress={() => setPhotoOpen(true)}
              disabled={!profile.photoUrl}
              accessibilityLabel="Mărește poza"
            >
              <Avatar name={profile.name} size={84} square photoUrl={profile.photoUrl} />
            </Pressable>
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
                <Pressable
                  onPress={s.onPress}
                  disabled={!s.onPress}
                  style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
                >
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    {s.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{s.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.statLabel}>
                    {s.label}
                    {s.onPress ? ' ›' : ''}
                  </Text>
                </Pressable>
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

        {/* Badge-uri: propuse de oameni după evenimente (de la 3 persoane în sus) și câștigate din activitate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge-uri</Text>
          <BadgesCard
            voted={getMyVotedBadges()}
            auto={badgeProgress.filter((p) => p.earned).map((p) => p.badge)}
            progress={badgeProgress}
            emptyText="Încă niciun badge. Le primești de la oamenii cu care ieși și din evenimentele la care mergi."
          />
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

        {/* Amintiri: poze de la evenimentele la care ai fost; se văd și pe profilul tău public */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amintiri</Text>
            <Pressable
              onPress={() => setAddMemory({ eventId: null })}
              hitSlop={8}
              style={({ pressed }) => [styles.addMemoryButton, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={16} color={colors.text} />
              <Text style={styles.addMemoryText}>Adaugă amintire</Text>
            </Pressable>
          </View>
          {memories.length === 0 ? (
            <Text style={styles.hint}>Încă nicio amintire. Adaugă poze de la evenimentele la care ai fost.</Text>
          ) : (
            <MemoriesGrid memories={memories} showVisibility onOpen={(m) => setOpenMemoryId(m.id)} />
          )}
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
          <EventHistoryCarousel
            events={pastEvents}
            onOpen={openPastEvent}
            onAddMemory={(eventId) => setAddMemory({ eventId })}
          />
        </View>

        {/* Contul: emailul și ieșirea */}
        <View style={styles.accountCard}>
          {user?.email ? <Text style={styles.accountEmail}>{user.email}</Text> : null}
          <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
            <Text style={styles.signOutText}>Ieși din cont</Text>
          </Pressable>
          {/* Ștergerea definitivă a contului (cere parola) */}
          <DeleteAccount />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <AddMemorySheet
        visible={addMemory !== null}
        events={pastEvents}
        initialEventId={addMemory?.eventId}
        onClose={() => setAddMemory(null)}
      />
      <MemoryViewer memory={memories.find((m) => m.id === openMemoryId) ?? null} onClose={() => setOpenMemoryId(null)} />
      <PhotoViewer
        photoUrl={photoOpen ? (profile.photoUrl ?? null) : null}
        caption={profile.name}
        onClose={() => setPhotoOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.screenTitle, fontSize: 32 },
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
  stat: { flex: 1, alignItems: 'center', gap: 2, borderRadius: radii.inner },
  statPressed: { opacity: 0.7 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '600', color: colors.text },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.muted },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addMemoryButton: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  addMemoryText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  sectionTitle: { ...type.label },
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
