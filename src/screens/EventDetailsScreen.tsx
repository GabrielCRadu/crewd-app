import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../components/Aurora';
import GlassIconButton from '../components/GlassIconButton';
import AddToGoogleCalendar from '../components/events/AddToGoogleCalendar';
import FriendsGoingSection from '../components/events/FriendsGoingSection';
import ShareEventSheet from '../components/events/ShareEventSheet';
import GradientButton from '../components/GradientButton';
import GlassBadge from '../components/events/GlassBadge';
import { useAuth } from '../context/AuthContext';
import { useMyGroups } from '../hooks/useMyGroups';
import { useNow } from '../hooks/useNow';
import { leaveGroupForEvent } from '../services/groupsService';
import { MIN_FORM_MEMBERS, canOpenChat, groupStatus } from '../utils/groupRules';
import { getCategory } from '../data/categories';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { useRatings } from '../hooks/useRatings';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined, joinEvent, leaveEvent } from '../services/preferencesService';
import { hasRated } from '../services/ratingsService';
import { appearance, colors, onThemeChange } from '../theme/colors';
import { type } from '../theme/typography';
import { gradients } from '../theme/gradients';
import { glass, radii } from '../theme/shape';
import type { IconName } from '../types/events';
import { formatLongDay, formatTime, hasEnded, isLive } from '../utils/dates';
import { formatDistance, haversineKm } from '../utils/distance';
import { tr } from '../i18n';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetails'>;

/**
 * Detaliile unui eveniment (docs/layout-guide.md → Detalii eveniment):
 * zona foto → titlu → Când | Unde → descriere → starea grupului tău (dacă ești înscris) → „Înscrie-te” jos.
 */
export default function EventDetailsScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const location = useUserLocation();
  const { events, loading } = useEvents(location.coords);
  const preferences = usePreferences();
  const myRatings = useRatings();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { height } = useWindowDimensions();
  const { profile, user } = useAuth();
  const { groups: myGroups } = useMyGroups();
  const now = useNow();
  const [shareOpen, setShareOpen] = useState(false);

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId]);

  if (!event) {
    return (
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.muted}>{tr('Evenimentul nu a fost găsit.')}</Text>
        )}
      </View>
    );
  }

  const category = getCategory(event.category);
  const distanceKm = haversineKm(location.coords, event.location);
  const joined = isJoined(preferences, event.id);
  const ended = hasEnded(event);
  const rated = hasRated(myRatings, event.id);
  // Grupulețul meu la acest eveniment (dacă sunt într-unul).
  const myGroup = myGroups.find((g) => g.eventId === event.id) ?? null;
  const myGroupStatus = myGroup ? groupStatus(myGroup, now) : null;
  const missing = myGroup ? Math.max(0, MIN_FORM_MEMBERS - myGroup.memberUids.length) : 0;
  const openRating = () => navigation.navigate('RateEvent', { eventId: event.id });
  // Înscrierea se salvează imediat în contul tău; dacă nu merge (ex. fără internet), revine și te anunțăm.
  const saveJoin = (action: typeof joinEvent) => {
    action(event).catch((e: Error) => Alert.alert(tr('Înscrierea nu s-a salvat'), e.message));
  };

  const openGroups = () => navigation.navigate('EventGroups', { eventId: event.id });
  // „Ieși din eveniment” te scoate întâi din grupuleț, apoi din eveniment (altfel ai rămâne membru-fantomă).
  const leaveEventAndGroup = () => {
    const uid = user?.uid ?? profile?.uid;
    (uid ? leaveGroupForEvent(event.id, uid) : Promise.resolve())
      .then(() => leaveEvent(event))
      .catch((e: Error) => Alert.alert(tr('Nu ai ieșit din eveniment'), e.message));
  };
  const confirmLeave = () =>
    Alert.alert(
      tr('Ieși din eveniment?'),
      myGroup ? tr('Ieși și din grupul tău de la acest eveniment.') : tr('Te poți înscrie din nou oricând.'),
      [
        { text: tr('Rămân'), style: 'cancel' },
        { text: tr('Ies'), style: 'destructive', onPress: leaveEventAndGroup },
      ],
    );
  // Ce scrie pe butonul „Vezi grupulețele”, după starea grupulețului meu.
  const groupsHint = !myGroup
    ? tr('Alege un grup cu care să mergi.')
    : canOpenChat(myGroup)
      ? tr('Ești într-un grup de {length} · chat-ul e deschis.', { length: myGroup.memberUids.length })
      : myGroupStatus === 'expired'
        ? tr('Grupul tău nu s-a format. Alege altul.')
        : tr('Grupul tău se formează: mai e nevoie de {missing}.', { missing: missing });

  return (
    <View style={styles.screen}>
      {/* Peste zona foto (mereu închisă), iconițele barei de sus rămân albe și pe tema deschisă */}
      {isFocused ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. Zona foto (~1/4 din ecran): aurora sub poză, umbrire jos, butonul „înapoi” și categoria */}
        <View style={[styles.hero, { height: Math.max(200, height * 0.28) }]}>
          {/* Aurora e închisă doar pe tema închisă; pe cea deschisă rămâne fundalul închis al pozei */}
          {appearance.isDark ? <Aurora style={StyleSheet.absoluteFill} /> : null}
          {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} /> : null}
          <LinearGradient colors={gradients.scrim} style={styles.scrim} />
          {/* Umbrire sus, ca butoanele și bara telefonului să se vadă și pe afișe albe */}
          <LinearGradient colors={gradients.scrimTop} style={[styles.scrimTop, { height: insets.top + 90 }]} />
          {event.imageUrl && event.imageCredit ? (
            <Text style={styles.imageCredit}>{tr('Foto: {credit}', { credit: event.imageCredit })}</Text>
          ) : null}
          <GlassIconButton
            icon="chevron-back"
            onPress={() => navigation.goBack()}
            style={[styles.back, styles.onPhoto, { top: insets.top + 8 }]}
            color={colors.photo.text}
          />
          {/* Trimite evenimentul unui prieten, în conversația voastră directă */}
          {!ended ? (
            <GlassIconButton
              icon="paper-plane-outline"
              onPress={() => setShareOpen(true)}
              style={[styles.share, styles.onPhoto, { top: insets.top + 8 }]}
            color={colors.photo.text}
            />
          ) : null}
          <View style={styles.heroBadges}>
            <GlassBadge icon={category.icon} label={category.label} />
            {isLive(event) ? <GlassBadge icon="radio-button-on" label={tr('ACUM')} /> : null}
            {ended ? <GlassBadge icon="checkmark-done" label={tr('S-A TERMINAT')} /> : null}
          </View>
        </View>

        <View style={styles.body}>
          {/* 2. Titlul */}
          <Text style={styles.title}>{event.title}</Text>

          {/* 3. Când | Unde: fiecare informație pe rândul ei, fără să treacă pe rândul următor */}
          <View style={styles.infoRow}>
            <InfoBox
              icon="calendar-outline"
              label={tr('Când')}
              main={formatLongDay(event.startsAt)}
              secondary={
                event.endsAtEstimated
                  ? formatTime(event.startsAt)
                  : `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`
              }
            />
            <InfoBox icon="location-outline" label={tr('Unde')} main={event.venueName} secondary={formatDistance(distanceKm)} />
          </View>
          {event.timeNote ? <Text style={styles.muted}>{event.timeNote}</Text> : null}

          {/* Preț, organizator, vârstă: doar ce e cunoscut */}
          {event.priceInfo || event.organizer || event.ageRestriction || event.address ? (
            <View style={styles.factsCard}>
              {event.priceInfo ? (
                <Fact icon="pricetag-outline">
                  {event.priceInfo.label}
                  {event.priceInfo.soldOut ? '  ·  Sold out' : ''}
                </Fact>
              ) : null}
              {event.address ? <Fact icon="map-outline">{event.address}</Fact> : null}
              {event.organizer ? <Fact icon="people-outline">{tr('Organizator:')}{' '}{event.organizer}</Fact> : null}
              {event.ageRestriction ? <Fact icon="alert-circle-outline">{tr('Vârstă:')}{' '}{event.ageRestriction}</Fact> : null}
            </View>
          ) : null}

          {/* 4. Descrierea */}
          {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

          {/* Atribuire: de unde provine evenimentul (obligatoriu cât timp folosim date din surse externe) */}
          {event.source ? (
            <Pressable onPress={() => Linking.openURL(event.source!.url)} hitSlop={6} style={styles.sourceRow}>
              <Ionicons name="open-outline" size={14} color={colors.faint} />
              <Text style={styles.sourceText}>{tr('Sursa:')} <Text style={styles.sourceLink}>{event.source.name}</Text> {tr('· verifică detaliile acolo')}</Text>
            </Pressable>
          ) : null}

          {/* 6. Grupulețele sunt pe un ecran separat („Vezi grupulețele”, după înscriere) */}
          {!ended && joined ? (
            <View style={styles.groupsHint}>
              <Ionicons name="people-outline" size={18} color={colors.muted} />
              <Text style={styles.groupsHintText}>{groupsHint}</Text>
            </View>
          ) : null}

          {/* Te-ai înscris: îl poți pune și în Google Calendar */}
          {!ended && joined ? <AddToGoogleCalendar event={event} /> : null}

          {/* 8. Prietenii care merg (înainte și după înscriere); tap → profilul lor */}
          <FriendsGoingSection
            event={event}
            onOpenPerson={(personId) => navigation.navigate('PersonProfile', { personId })}
          />
        </View>
      </ScrollView>

      {/* 7. „Înscrie-te” fix jos; după eveniment devine „Evaluează oamenii” */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {ended ? (
          !joined ? (
            <View style={styles.joinedPill}>
              <Text style={styles.endedText}>{tr('Evenimentul s-a terminat')}</Text>
            </View>
          ) : (
            /* Ai fost la eveniment: evaluezi oamenii */
            <View style={styles.endedActions}>
              {rated ? (
                <View style={styles.joinedRow}>
                  <View style={styles.joinedPill}>
                    <Text style={styles.joinedText}>{tr('Evaluat ✓')}</Text>
                  </View>
                  <Pressable onPress={openRating} hitSlop={8}>
                    <Text style={styles.cancel}>{tr('Modifică')}</Text>
                  </Pressable>
                </View>
              ) : (
                <GradientButton label={tr('Evaluează oamenii')} icon="people" onPress={openRating} />
              )}
            </View>
          )
        ) : joined ? (
          /* După înscriere, butonul se împarte în două: ieși din eveniment / vezi grupulețele */
          <View style={styles.ctaRow}>
            <Pressable onPress={confirmLeave} style={({ pressed }) => [styles.ticketButton, pressed && styles.pressed]}>
              <Ionicons name="exit-outline" size={18} color={colors.text} />
              <Text style={styles.ticketText}>{tr('Ieși')}</Text>
            </Pressable>
            <GradientButton label={tr('Vezi grupurile')} icon="people" onPress={openGroups} style={styles.ctaMain} />
          </View>
        ) : (
          <View style={styles.ctaRow}>
            {event.ticketUrl ? (
              <Pressable
                onPress={() => Linking.openURL(event.ticketUrl!)}
                style={({ pressed }) => [styles.ticketButton, pressed && styles.pressed]}
              >
                <Ionicons name="ticket-outline" size={18} color={colors.text} />
                <Text style={styles.ticketText}>{event.priceInfo?.isFree ? tr('Înscriere') : tr('Bilete')}</Text>
              </Pressable>
            ) : null}
            <GradientButton label={tr('Înscrie-te')} icon="arrow-forward" onPress={() => saveJoin(joinEvent)} style={styles.ctaMain} />
          </View>
        )}
      </View>

      {/* „Trimite unui prieten”: după trimitere, deschide conversația directă din tab-ul Chat */}
      <ShareEventSheet
        event={event}
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        onSent={(personId) => {
          setShareOpen(false);
          navigation.getParent()?.navigate('Chats', { screen: 'DirectChat', params: { personId }, initial: false });
        }}
      />
    </View>
  );
}

/**
 * O casetă „Când” / „Unde”: eticheta cu iconiță, apoi valoarea principală și cea secundară,
 * fiecare pe câte un rând. Textele lungi se micșorează ca să încapă pe un rând, nu se rup.
 */
function InfoBox({ icon, label, main, secondary }: { icon: IconName; label: string; main: string; secondary: string }) {
  return (
    <View style={styles.infoBox}>
      <View style={styles.infoLabelRow}>
        <Ionicons name={icon} size={14} color={colors.faint} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {main}
      </Text>
      <Text style={styles.infoSecondary} numberOfLines={1}>
        {secondary}
      </Text>
    </View>
  );
}

/** Un rând de informație cu iconiță (preț, adresă, organizator, vârstă). */
function Fact({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <View style={styles.factRow}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.factText}>{children}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    imageCredit: { position: 'absolute', right: 12, bottom: 8, fontSize: 10, color: colors.photo.faint },
    factsCard: { ...glass, padding: 14, gap: 10, borderRadius: radii.inner },
    factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    factText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sourceText: { flex: 1, fontSize: 12, color: colors.faint },
    sourceLink: { color: colors.muted, textDecorationLine: 'underline' },
    ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    groupsHint: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radii.inner },
    groupsHintText: { flex: 1, color: colors.muted, fontSize: 14 },
    ctaMain: { flex: 1 },
    ticketButton: {
      ...glass,
      height: 58,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: radii.pill,
    },
    ticketText: { color: colors.text, fontSize: 16, fontWeight: '500' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { paddingBottom: 24 },
    // Locul pozei: închis pe ambele teme, pentru că peste el stă text alb.
    hero: { overflow: 'hidden', backgroundColor: colors.photo.placeholder },
    scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
    scrimTop: { position: 'absolute', left: 0, right: 0, top: 0 },
    back: { position: 'absolute', left: 20 },
    // Butoanele de pe poză: fundal închis (nu sticlă albă), ca să rămână vizibile pe afișe deschise la culoare.
    onPhoto: { backgroundColor: colors.photo.glass, borderColor: colors.photo.glassBorder },
    share: { position: 'absolute', right: 20 },
    heroBadges: { position: 'absolute', left: 20, bottom: 16, flexDirection: 'row', gap: 8 },
    body: { padding: 20, gap: 16 },
    title: { ...type.screenTitle, fontSize: 30 },
    infoRow: { flexDirection: 'row', gap: 12 },
    infoBox: { ...glass, flex: 1, padding: 14, gap: 6, borderRadius: radii.inner },
    infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoLabel: { fontSize: 12, color: colors.faint },
    infoValue: { fontSize: 16, fontWeight: '600', color: colors.text },
    infoSecondary: { fontSize: 14, color: colors.muted },
    description: { fontSize: 15, lineHeight: 22, color: colors.muted },
    muted: { fontSize: 13, color: colors.muted },
    sectionTitle: { ...type.label, marginTop: 8 },
    pressed: { opacity: 0.8 },
    bottomBar: {
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    endedActions: { gap: 10 },
    joinedPill: {
      ...glass,
      flex: 1,
      height: 58,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    joinedText: { color: colors.text, fontSize: 17, fontWeight: '600' },
    endedText: { color: colors.muted, fontSize: 16, fontWeight: '500' },
    cancel: { color: colors.muted, fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
