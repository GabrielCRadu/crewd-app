import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { tr, trPlural } from '../i18n';

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
/** De la câte puncte de mișcare a degetului considerăm că tragi de bară (nu doar apeși). */
const SWIPE_START = 8;
/**
 * Cât tragi spre dreapta / în sus ca să arunci bara. În sus e mai puțin: bara stă chiar sub
 * bara de stare a telefonului, iar acolo Android nu mai trimite mișcarea degetului.
 */
const SWIPE_DISMISS_X = 80;
const SWIPE_DISMISS_Y = 20;
/** Sau cât de repede (o aruncare scurtă și rapidă ajunge). */
const SWIPE_VELOCITY = 0.5;
const SWIPE_VELOCITY_UP = 0.3;

/**
 * Noutățile de prietenie, sus, peste orice ecran:
 * 1. când sosește o cerere, intră din dreapta o bară pe toată lățimea, pe un singur rând
 *    (poza, numele, „Acceptă”, ✕); apăsarea pe poză/nume deschide profilul.
 *    La „Vă potriviți” (v-ați dat unul altuia „Aș mai ieși”): „Adăugați-vă” sau ✕ (mai târziu);
 *    Bara se poate arunca mai repede trăgând-o spre dreapta sau în sus;
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

  // Cât ai tras de bară cu degetul (spre dreapta / în sus), ca s-o arunci mai repede.
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const hide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setPerson(null));
  };

  // Aruncată cu degetul: pleacă în direcția în care ai tras-o, apoi dispare.
  const dismissBySwipe = (direction: 'right' | 'up') => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const target = direction === 'right' ? dragX : dragY;
    const toValue = direction === 'right' ? screenWidthRef.current : -200;
    Animated.timing(target, { toValue, duration: 180, useNativeDriver: true }).start(() => setPerson(null));
  };
  const screenWidthRef = useRef(screenWidth);
  screenWidthRef.current = screenWidth;
  const dismissRef = useRef(dismissBySwipe);
  dismissRef.current = dismissBySwipe;

  const swipe = useRef(
    PanResponder.create({
      // Doar când degetul chiar se mișcă (atingerile scurte rămân pentru butoane și profil).
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > SWIPE_START || Math.abs(g.dy) > SWIPE_START,
      onPanResponderMove: (_, g) => {
        dragX.setValue(Math.max(0, g.dx));
        dragY.setValue(Math.min(0, g.dy));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_DISMISS_X || g.vx > SWIPE_VELOCITY) dismissRef.current('right');
        else if (g.dy < -SWIPE_DISMISS_Y || g.vy < -SWIPE_VELOCITY_UP) dismissRef.current('up');
        else {
          // N-ai tras destul: revine la loc.
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
        }
      },
      // Cât tragi de bară, gestul rămâne al ei (altfel tragerea în sus se pierdea pe drum).
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        dragX.setValue(0);
        dragY.setValue(0);
      },
    }),
  ).current;

  useEffect(() => {
    const unsubscribe = subscribeToFriendNotices((notice) => {
      const sender = getPerson(notice.personId);
      if (!sender) return;
      setPerson(sender);
      setKind(notice.kind);
      dragX.setValue(0);
      dragY.setValue(0);
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
        accessibilityLabel={trPlural(pendingCount, '{n} cerere de prietenie', '{n} cereri de prietenie')}
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
      {...swipe.panHandlers}
      style={[
        styles.card,
        {
          top: insets.top + 8,
          opacity: slide,
          transform: [{ translateX: Animated.add(translateX, dragX) }, { translateY: dragY }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={
        isMatch
          ? tr('Vă potriviți. Și {name} ar mai ieși cu tine.', { name: person.name })
          : tr('{name} ți-a trimis o cerere de prietenie', { name: person.name })
      }
    >
      {/* Un singur rând: poza și textul (deschid profilul), apoi „Acceptă” și ✕ */}
      <Pressable onPress={openProfile} style={styles.body} accessibilityLabel={tr('Vezi profilul lui {name}', { name: person.name })}>
        <Avatar name={person.name} size={40} square photoUrl={person.photoUrl} />
        <View style={styles.text}>
          {isMatch ? (
            <>
              <Text style={styles.eyebrow}>{tr('VĂ POTRIVIȚI')}</Text>
              <Text style={styles.message} numberOfLines={2}>{tr('Și {name} ar mai ieși cu tine', { name: person.name })}</Text>
            </>
          ) : (
            <>
              <Text style={styles.name} numberOfLines={1}>
                {person.name}
                {person.age ? <Text style={styles.age}>, {person.age}</Text> : null}
              </Text>
              <Text style={styles.message} numberOfLines={1}>{tr('ți-a trimis o cerere de prietenie')}</Text>
            </>
          )}
        </View>
      </Pressable>

      <Pressable onPress={accept} style={({ pressed }) => [styles.accept, pressed && styles.pressed]}>
        <Ionicons name={isMatch ? 'people' : 'checkmark'} size={15} color={colors.onLight} />
        <Text style={styles.acceptText}>{isMatch ? tr('Adăugați-vă') : tr('Acceptă')}</Text>
      </Pressable>
      <Pressable onPress={hide} hitSlop={10} accessibilityLabel={isMatch ? tr('Mai târziu') : tr('Închide')}>
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
