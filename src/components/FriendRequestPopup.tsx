import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from './Avatar';
import { useFriends } from '../hooks/useFriends';
import {
  acceptFriendRequest,
  idsWithStatus,
  scheduleDemoFriendRequest,
  subscribeToFriendRequests,
} from '../services/friendsService';
import { getPerson } from '../services/peopleService';
import { colors } from '../theme/colors';
import { radii } from '../theme/shape';
import type { Person } from '../types/social';

interface Props {
  /** Deschide profilul persoanei care a trimis cererea. */
  onOpenProfile: (personId: string) => void;
  /** Deschide lista de prieteni (cu cererile primite sus). */
  onOpenRequests: () => void;
  /**
   * Arată butonul mic cu numărul de cereri. Doar pe ecranele principale: pe celelalte, colțul
   * din dreapta sus e ocupat de butoanele ecranului (ex. „Editează”, ⋯).
   */
  showPill: boolean;
}

/** Cât stă notificarea mare pe ecran; apoi pleacă și rămâne butonul mic. */
const VISIBLE_MS = 5000;
const WIDTH = 300;

/**
 * Cererile de prietenie, în colțul din dreapta sus, peste orice ecran:
 * 1. când sosește o cerere, intră din dreapta notificarea mare (poza, numele, „Acceptă”, „Vezi profilul”);
 * 2. după câteva secunde pleacă, iar în colț rămâne un buton mic cu numărul de cereri primite,
 *    cât timp ai cereri la care n-ai răspuns. Butonul deschide lista de prieteni.
 */
export default function FriendRequestPopup({ onOpenProfile, onOpenRequests, showPill }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const friends = useFriends();
  const pendingCount = idsWithStatus(friends, 'incoming').length;
  const [person, setPerson] = useState<Person | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setPerson(null));
  };

  useEffect(() => {
    const unsubscribe = subscribeToFriendRequests((personId) => {
      const sender = getPerson(personId);
      if (!sender) return;
      setPerson(sender);
      slide.setValue(0);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, VISIBLE_MS);
    });
    // DEMO: o cerere de la Tudor la câteva secunde după pornire.
    scheduleDemoFriendRequest();
    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Fără notificarea mare: butonul mic cu numărul de cereri, cât timp ai cereri nerezolvate.
  if (!person) {
    if (!showPill || pendingCount === 0) return null;
    return (
      <Pressable
        onPress={onOpenRequests}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${pendingCount} ${pendingCount === 1 ? 'cerere' : 'cereri'} de prietenie`}
        style={({ pressed }) => [styles.pill, { top: insets.top + 10 }, pressed && styles.pressed]}
      >
        <Ionicons name="person-add" size={14} color={colors.onLight} />
        <Text style={styles.pillText}>{pendingCount}</Text>
      </Pressable>
    );
  }

  const cardWidth = Math.min(WIDTH, screenWidth - 24);
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [cardWidth + 24, 0] });

  const openProfile = () => {
    hide();
    onOpenProfile(person.id);
  };
  const accept = () => {
    void acceptFriendRequest(person.id);
    hide();
  };

  return (
    <Animated.View
      style={[styles.card, { top: insets.top + 8, width: cardWidth, opacity: slide, transform: [{ translateX }] }]}
      accessibilityRole="alert"
      accessibilityLabel={`${person.name} ți-a trimis o cerere de prietenie`}
    >
      <Pressable onPress={openProfile} style={styles.body}>
        <Avatar name={person.name} size={48} square photoUrl={person.photoUrl} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {person.name}
            {person.age ? <Text style={styles.age}>, {person.age}</Text> : null}
          </Text>
          <Text style={styles.message}>ți-a trimis o cerere de prietenie</Text>
        </View>
        <Pressable onPress={hide} hitSlop={10} accessibilityLabel="Închide" style={styles.close}>
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={accept} style={({ pressed }) => [styles.button, styles.accept, pressed && styles.pressed]}>
          <Ionicons name="checkmark" size={16} color={colors.onLight} />
          <Text style={[styles.buttonText, styles.acceptText]}>Acceptă</Text>
        </Pressable>
        <Pressable onPress={openProfile} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Vezi profilul</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    right: 12,
    zIndex: 100,
    elevation: 12,
    gap: 12,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  age: { color: colors.muted, fontWeight: '500' },
  message: { color: colors.muted, fontSize: 13 },
  close: { alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  accept: { backgroundColor: colors.text, borderColor: colors.text },
  secondary: { backgroundColor: colors.card, borderColor: colors.border },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  acceptText: { color: colors.onLight },
  // Butonul mic: pastilă albă cu iconița și numărul de cereri.
  pill: {
    position: 'absolute',
    right: 14,
    zIndex: 100,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
    boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
  },
  pillText: { color: colors.onLight, fontSize: 13, fontWeight: '700' },
});
