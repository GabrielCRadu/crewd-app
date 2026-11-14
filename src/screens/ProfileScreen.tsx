import { Fragment, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
import ProfileMenu from '../components/ProfileMenu';
import type { MenuAnchor } from '../components/ProfileMenu';
import InviteQrSheet from '../components/InviteQrSheet';
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
import { tr } from '../i18n';

/**
 * Tab-ul Profil (vezi docs/layout-guide.md): identitate cu statistici, „Despre mine”,
 * ce spun alții despre tine, ce îți place, tag-uri învățate, istoricul (privat) și contul.
 * Datele vin din profilul utilizatorului logat (AuthContext → Firestore users/{uid}).
 */
export default function ProfileScreen() {
  const { profile, updateBio, removeLearnedTag } = useAuth();
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
  const [qrOpen, setQrOpen] = useState(false);
  // Meniul cu trei linii: unde se deschide (null = închis).
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const menuButton = useRef<ComponentRef<typeof View>>(null);
  const { width: windowWidth } = useWindowDimensions();
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

  // „prieteni” deschide lista de prieteni. Cererile noi apar doar în notificarea de sus, nu și aici.
  const stats = [
    { value: idsWithStatus(friends, 'friends').length, label: tr('prieteni'), onPress: () => navigation.navigate('FriendsList') },
    { value: myGroups.length, label: tr('grupuri') },
    { value: pastEvents.length, label: tr('evenimente') },
  ];

  const saveBio = (bio: string) => {
    updateBio(bio).catch(() => Alert.alert(tr('Nu am putut salva'), tr('Verifică conexiunea și încearcă din nou.')));
  };

  // Meniul se deschide chiar sub butonul cu trei linii, aliniat la marginea lui din dreapta.
  const openMenu = () => {
    menuButton.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ top: y + height + 8, right: Math.max(12, windowWidth - (x + width)) });
    });
  };

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
          <Text style={styles.title}>{tr('Profil')}</Text>
          <View style={styles.headerActions}>
            {/* Codul tău QR (cu username-ul), mic; apăsat se deschide mare, cu linkul de invitație */}
            {profile.username ? (
              <Pressable
                onPress={() => setQrOpen(true)}
                accessibilityLabel={tr('Codul tău QR de invitație')}
                style={({ pressed }) => [styles.qrButton, pressed && styles.qrPressed]}
              >
                <Ionicons name="qr-code-outline" size={18} color={colors.text} />
              </Pressable>
            ) : null}
            {/* Meniul (trei linii, ca pe Instagram): Editează, Setări, Delogare */}
            <Pressable
              ref={menuButton}
              onPress={openMenu}
              accessibilityLabel={tr('Meniu')}
              style={({ pressed }) => [styles.qrButton, pressed && styles.qrPressed]}
            >
              <Ionicons name="menu" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Identitatea + rândul de statistici */}
        <View style={styles.identity}>
          <Aurora style={StyleSheet.absoluteFill} />
          <View style={styles.identityRow}>
            <Pressable
              onPress={() => setPhotoOpen(true)}
              disabled={!profile.photoUrl}
              accessibilityLabel={tr('Mărește poza')}
            >
              <Avatar name={profile.name} size={84} square photoUrl={profile.photoUrl} />
            </Pressable>
            <View style={styles.identityText}>
              <Text style={styles.name}>
                {profile.name}, {profile.age}
              </Text>
              {profile.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
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
                  <Text style={styles.statValue}>{s.value}</Text>
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
          <Text style={styles.sectionTitle}>{tr('Ce spun alții despre tine')}</Text>
          <ReputationStats reputation={reputation} />
        </View>

        {/* Badge-uri: propuse de oameni după evenimente (de la 3 persoane în sus) și câștigate din activitate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr('Badge-uri')}</Text>
          <BadgesCard
            voted={getMyVotedBadges()}
            auto={badgeProgress.filter((p) => p.earned).map((p) => p.badge)}
            progress={badgeProgress}
            emptyText={tr('Încă niciun badge. Le primești de la oamenii cu care ieși și din evenimentele la care mergi.')}
          />
        </View>

        {/* Tag-urile alese, într-un singur card, pe grupuri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr('Ce îți place')}</Text>
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
                  {profile.chosenTags[group.id].length === 0 ? <Text style={styles.hint}>{tr('Nimic ales încă.')}</Text> : null}
                </View>
              </View>
            ))}
          </GradientBorderCard>
        </View>

        <View style={[styles.card, styles.learnedCard]}>
          <Text style={styles.cardTitle}>{tr('Învățate din evenimentele tale')}</Text>
          <Text style={styles.hint}>{tr('Tag-uri adăugate automat după înscrieri. Le poți scoate oricând.')}</Text>
          <View style={styles.tags}>
            {profile.learnedTags.map((t) => (
              <Chip key={t} label={t} dashed onRemove={() => void removeLearnedTag(t)} />
            ))}
            {profile.learnedTags.length === 0 ? <Text style={styles.hint}>{tr('Niciun tag învățat încă.')}</Text> : null}
          </View>
        </View>

        {/* Amintiri: poze de la evenimentele la care ai fost; se văd și pe profilul tău public */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{tr('Amintiri')}</Text>
            <Pressable
              onPress={() => setAddMemory({ eventId: null })}
              hitSlop={8}
              style={({ pressed }) => [styles.addMemoryButton, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={16} color={colors.text} />
              <Text style={styles.addMemoryText}>{tr('Adaugă amintire')}</Text>
            </Pressable>
          </View>
          {memories.length === 0 ? (
            <Text style={styles.hint}>{tr('Încă nicio amintire. Adaugă poze de la evenimentele la care ai fost.')}</Text>
          ) : (
            <MemoriesGrid memories={memories} showVisibility onOpen={(m) => setOpenMemoryId(m.id)} />
          )}
        </View>

        {/* Istoricul (privat): evenimentele trecute apar automat; o carte deschide detaliile, de unde evaluezi */}
        <View style={styles.section}>
          <View>
            <Text style={styles.sectionTitle}>{tr('Istoricul tău')}</Text>
            <View style={styles.privateRow}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.muted} />
              <Text style={styles.hint}>{tr('Doar tu vezi această listă.')}</Text>
            </View>
          </View>
          <EventHistoryCarousel
            events={pastEvents}
            onOpen={openPastEvent}
            onAddMemory={(eventId) => setAddMemory({ eventId })}
          />
        </View>
        {/* Contul (emailul, ieșirea, ștergerea) s-a mutat în Setări (meniul cu trei linii). */}
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
      <ProfileMenu
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onEdit={() => navigation.navigate('EditProfile')}
        onSettings={() => navigation.navigate('Settings')}
      />
      {profile.username ? (
        <InviteQrSheet
          visible={qrOpen}
          username={profile.username}
          name={profile.name}
          photoUrl={profile.photoUrl}
          onClose={() => setQrOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** Înălțimea butoanelor din antet (codul QR și meniul), ca să stea la aceeași linie. */
const HEADER_BUTTON_HEIGHT = 40;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Iconița QR și „Editează” au aceeași înălțime fixă și sunt centrate pe același rând.
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrButton: {
    ...glass,
    width: HEADER_BUTTON_HEIGHT,
    height: HEADER_BUTTON_HEIGHT,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPressed: { backgroundColor: colors.cardStrong },
  title: { ...type.screenTitle, fontSize: 32 },
  pressed: { backgroundColor: colors.cardStrong },
  identity: { ...glass, borderRadius: radii.card, overflow: 'hidden' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  identityText: { flex: 1, gap: 6 },
  name: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  username: { color: colors.muted, fontSize: 15, marginTop: -2 },
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
  statValue: { fontSize: 20, fontWeight: '600', color: colors.text },
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
});
