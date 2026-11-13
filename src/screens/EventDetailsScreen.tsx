import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import GradientButton from '../components/GradientButton';
import GlassBadge from '../components/events/GlassBadge';
import { getCategory } from '../data/categories';
import { MY_GROUPS, SUGGESTED_GROUPS } from '../data/mockSocial';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined, joinEvent, leaveEvent } from '../services/preferencesService';
import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { glass, radii } from '../theme/shape';
import type { ChatGroup } from '../types/social';
import { formatLongDate, isLive } from '../utils/dates';
import { formatDistance, haversineKm } from '../utils/distance';
import { formatFriendsGoing } from '../utils/format';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetails'>;

/**
 * Detaliile unui eveniment (docs/layout-guide.md → Detalii eveniment):
 * zona foto → titlu → Când | Unde → descriere → cine merge → „Grupuri pe gustul tău” → „Înscrie-te” jos.
 */
export default function EventDetailsScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const location = useUserLocation();
  const { events, loading } = useEvents(location.coords);
  const preferences = usePreferences();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId]);

  if (!event) {
    return (
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.muted}>Evenimentul nu a fost găsit.</Text>
        )}
      </View>
    );
  }

  const category = getCategory(event.category);
  const distanceKm = haversineKm(location.coords, event.location);
  const joined = isJoined(preferences, event.id);
  // Grupurile de chat pentru acest eveniment (mock: potrivite după titlu, din mockSocial.ts).
  const groups = [...MY_GROUPS, ...SUGGESTED_GROUPS].filter((g) => g.eventTitle === event.title);

  // „Intră” deschide conversația grupului în tab-ul Chat (cu lista de chat-uri dedesubt, pentru „înapoi”).
  const openGroup = (group: ChatGroup) => {
    navigation.getParent()?.navigate('Chats', { screen: 'ChatRoom', params: { groupId: group.id }, initial: false });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. Zona foto (~1/4 din ecran): aurora sub poză, umbrire jos, butonul „înapoi” și categoria */}
        <View style={[styles.hero, { height: Math.max(200, height * 0.28) }]}>
          <Aurora style={StyleSheet.absoluteFill} />
          <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={gradients.scrim} style={styles.scrim} />
          <GlassIconButton
            icon="chevron-back"
            onPress={() => navigation.goBack()}
            style={[styles.back, { top: insets.top + 8 }]}
          />
          <View style={styles.heroBadges}>
            <GlassBadge icon={category.icon} label={category.label} />
            {isLive(event) ? <GlassBadge icon="radio-button-on" label="ACUM" /> : null}
          </View>
        </View>

        <View style={styles.body}>
          {/* 2. Titlul */}
          <Text style={styles.title}>{event.title}</Text>

          {/* 3. Când | Unde */}
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Când</Text>
              <Text style={styles.infoValue}>{formatLongDate(event.startsAt)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Unde</Text>
              <Text style={styles.infoValue}>
                {event.venueName} · {formatDistance(distanceKm)}
              </Text>
            </View>
          </View>

          {/* 4. Descrierea */}
          <Text style={styles.description}>{event.description}</Text>

          {/* 5. Cine merge */}
          {event.friendsGoing.length > 0 ? (
            <View style={styles.friendsRow}>
              <View style={styles.avatars}>
                {event.friendsGoing.slice(0, 3).map((name, i) => (
                  <View key={name} style={[styles.avatarRing, i > 0 && styles.avatarOverlap]}>
                    <Avatar name={name} size={36} />
                  </View>
                ))}
              </View>
              <Text style={styles.friendsText}>{formatFriendsGoing(event.friendsGoing)}</Text>
            </View>
          ) : null}

          {/* 6. Grupuri pe gustul tău */}
          <Text style={styles.sectionTitle}>Grupuri pe gustul tău</Text>
          {groups.length === 0 ? (
            <Text style={styles.muted}>Încă nu s-a format niciun grup pentru acest eveniment.</Text>
          ) : (
            groups.map((g) => (
              <View key={g.id} style={styles.groupCard}>
                <View style={styles.groupText}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.muted}>
                    {g.membersCount} persoane · {g.commonTagsCount} tag-uri comune
                  </Text>
                  <Text style={styles.groupMeetup}>
                    Se văd {g.meetupWhen}, {g.meetupWhere}
                  </Text>
                </View>
                <Pressable onPress={() => openGroup(g)} style={({ pressed }) => [styles.joinGroup, pressed && styles.pressed]}>
                  <Text style={styles.joinGroupText}>Intră</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 7. „Înscrie-te”, fix jos */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {joined ? (
          <View style={styles.joinedRow}>
            <View style={styles.joinedPill}>
              <Text style={styles.joinedText}>Înscris ✓</Text>
            </View>
            <Pressable onPress={() => leaveEvent(event)} hitSlop={8}>
              <Text style={styles.cancel}>Anulează</Text>
            </Pressable>
          </View>
        ) : (
          <GradientButton label="Înscrie-te" icon="arrow-forward" onPress={() => joinEvent(event)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  hero: { overflow: 'hidden', backgroundColor: colors.backgroundAlt },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  back: { position: 'absolute', left: 20 },
  heroBadges: { position: 'absolute', left: 20, bottom: 16, flexDirection: 'row', gap: 8 },
  body: { padding: 20, gap: 16 },
  title: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoBox: { ...glass, flex: 1, padding: 14, gap: 4, borderRadius: radii.inner },
  infoLabel: { fontSize: 12, color: colors.faint },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  description: { fontSize: 15, lineHeight: 22, color: colors.muted },
  muted: { fontSize: 13, color: colors.muted },
  friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row' },
  // Inel în culoarea fundalului, ca avatarele suprapuse să se despartă vizual.
  avatarRing: { borderRadius: radii.pill, borderWidth: 2, borderColor: colors.background },
  avatarOverlap: { marginLeft: -12 },
  friendsText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 8 },
  groupCard: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.card },
  groupText: { flex: 1, gap: 3 },
  groupName: { fontSize: 16, fontWeight: '600', color: colors.text },
  groupMeetup: { fontSize: 13, fontWeight: '500', color: colors.text },
  joinGroup: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: radii.pill, backgroundColor: colors.text },
  joinGroupText: { color: colors.onLight, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  joinedPill: {
    ...glass,
    flex: 1,
    height: 58,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  cancel: { color: colors.muted, fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' },
});
