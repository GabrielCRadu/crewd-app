import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from './Avatar';
import { useFriends } from '../hooks/useFriends';
import {
  acceptFriendRequest,
  acceptMatch,
  idsWithStatus,
  scheduleDemoFriendRequest,
  subscribeToFriendNotices,
} from '../services/friendsService';
import type { FriendNotice } from '../services/friendsService';
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

/**
 * Noutățile de prietenie, sus, peste orice ecran:
 * 1. când sosește o cerere, intră din dreapta o bară pe toată lățimea, pe un singur rând
 *    (poza, numele, „Acceptă”, ✕); apăsarea pe poză/nume deschide profilul.
 *    La „Vă potriviți” (v-ați dat unul altuia „Aș mai ieși”): „Adăugați-vă” sau ✕ (mai târziu);
 * 2. după câteva secunde pleacă, iar în colț rămâne un buton mic cu numărul de cereri primite,
 *    cât timp ai cereri la care n-ai răspuns. Butonul deschide lista de prieteni.
 */
export default function FriendRequestPopup({ onOpenProfile, onOpenRequests, showPill }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const friends = useFriends();
  const pendingCount = idsWithStatus(friends, 'incoming').length;
  const [person, setPerson] = useState<Person | null>(null);
  const [kind, setKind] = useState<FriendNotice['kind']>('request');
  const slide = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setPerson(null));
  };

  useEffect(() => {
    const unsubscribe = subscribeToFriendNotices((notice) => {
      const sender = getPerson(notice.personId);
      if (!sender) return;
      setPerson(sender);
      setKind(notice.kind);
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

  // Bara ocupă toată lățimea; intră din dreapta.
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [screenWidth, 0] });

  const openProfile = () => {
    hide();
    onOpenProfile(person.id);
  };
  const isMatch = kind === 'match';
  const accept = () => {
    void (isMatch ? acceptMatch(person.id) : acceptFriendRequest(person.id));
    hide();
  };

  return (
    <Animated.View
      style={[styles.card, { top: insets.top + 8, opacity: slide, transform: [{ translateX }] }]}
      accessibilityRole="alert"
      accessibilityLabel={
        isMatch
          ? `Vă potriviți. Și ${person.name} ar mai ieși cu tine.`
          : `${person.name} ți-a trimis o cerere de prietenie`
      }
    >
      {/* Un singur rând: poza și textul (deschid profilul), apoi „Acceptă” și ✕ */}
      <Pressable onPress={openProfile} style={styles.body} accessibilityLabel={`Vezi profilul lui ${person.name}`}>
        <Avatar name={person.name} size={40} square photoUrl={person.photoUrl} />
        <View style={styles.text}>
          {isMatch ? (
            <>
              <Text style={styles.eyebrow}>VĂ POTRIVIȚI</Text>
              <Text style={styles.message} numberOfLines={2}>
                Și <Text style={styles.inlineName}>{person.name}</Text> ar mai ieși cu tine
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.name} numberOfLines={1}>
                {person.name}
                {person.age ? <Text style={styles.age}>, {person.age}</Text> : null}
              </Text>
              <Text style={styles.message} numberOfLines={1}>
                ți-a trimis o cerere de prietenie
              </Text>
            </>
          )}
        </View>
      </Pressable>

      <Pressable onPress={accept} style={({ pressed }) => [styles.accept, pressed && styles.pressed]}>
        <Ionicons name={isMatch ? 'people' : 'checkmark'} size={15} color={colors.onLight} />
        <Text style={styles.acceptText}>{isMatch ? 'Adăugați-vă' : 'Acceptă'}</Text>
      </Pressable>
      <Pressable onPress={hide} hitSlop={10} accessibilityLabel={isMatch ? 'Mai târziu' : 'Închide'}>
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Bara pe toată lățimea ecranului, joasă: totul pe un rând.
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: radii.inner + 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, gap: 1 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  inlineName: { color: colors.text, fontWeight: '700' },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  age: { color: colors.muted, fontWeight: '500' },
  message: { color: colors.muted, fontSize: 12 },
  accept: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  pressed: { opacity: 0.8 },
  acceptText: { color: colors.onLight, fontSize: 13, fontWeight: '700' },
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
