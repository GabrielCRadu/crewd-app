import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import Avatar from './Avatar';
import GlassIconButton from './GlassIconButton';
import GradientButton from './GradientButton';
import { copyInvite, inviteUrl, shareInvite } from '../services/inviteService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

interface Props {
  visible: boolean;
  uid: string;
  name: string;
  photoUrl?: string | null;
  onClose: () => void;
}

/** Cât tragi în jos panoul ca să se închidă, în puncte. */
const CLOSE_DRAG = 120;
/** Cât stă afișat „Link copiat!”. */
const COPIED_MS = 2000;

/**
 * Codul tău QR, mare, într-un panou care urcă de jos: cine îl scanează ajunge pe profilul tău
 * și te poate adăuga la prieteni. Dedesubt: trimiterea linkului pe alte aplicații și copierea lui.
 * Se închide cu X, cu swipe în jos sau cu o atingere în afara panoului.
 */
export default function InviteQrSheet({ visible, uid, name, photoUrl, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width - 120, 260);
  const url = inviteUrl(uid);
  const [copied, setCopied] = useState(false);

  // Panoul: urcă la deschidere și se poate trage în jos.
  const dragY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    setCopied(false);
    dragY.setValue(60);
    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 70 }).start();
  }, [visible, dragY]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DRAG || g.vy > 1.2) onCloseRef.current();
        else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 9 }).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    copyInvite(uid)
      .then(() => setCopied(true))
      .catch(() => Alert.alert('Nu am putut copia linkul', 'Încearcă din nou.'));
  };

  // Dacă meniul de share nu merge, linkul se copiază în schimb.
  const share = () => {
    shareInvite(uid)
      .then((result) => result === 'copied' && setCopied(true))
      .catch(() => Alert.alert('Nu am putut trimite linkul', 'Încearcă din nou.'));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Închide" />

        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: dragY }] }]}
          {...pan.panHandlers}
        >
          <View style={styles.grabber} />
          <View style={styles.top}>
            <GlassIconButton icon="close" size={38} onPress={onClose} />
          </View>

          <View style={styles.who}>
            <Avatar name={name} size={56} square photoUrl={photoUrl} />
            <Text style={styles.name}>{name}</Text>
          </View>

          {/* Codul: mereu negru pe alb, ca să-l citească orice cameră; poza ta în mijloc */}
          <View style={styles.qrCard}>
            <QRCode
              value={url}
              size={qrSize}
              color={colors.onLight}
              backgroundColor={colors.text}
              ecl="H"
              logo={photoUrl ? { uri: photoUrl } : undefined}
              logoSize={qrSize * 0.2}
              logoMargin={3}
              logoBorderRadius={8}
              logoBackgroundColor={colors.text}
            />
          </View>
          <Text style={styles.hint}>Scanează ca să mă adaugi ca prieten</Text>

          <View style={styles.actions}>
            <GradientButton label="Distribuie linkul de invitație" icon="share-outline" iconFirst onPress={share} />
            <Pressable
              onPress={copy}
              style={({ pressed }) => [styles.copyButton, pressed && styles.copyPressed]}
              accessibilityLabel="Copiază linkul"
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.text} />
              <Text style={styles.copyText}>{copied ? 'Link copiat!' : 'Copiază linkul'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
    gap: 16,
  },
  grabber: { width: 40, height: 4, borderRadius: radii.pill, backgroundColor: colors.border },
  top: { position: 'absolute', top: 14, right: 16 },
  who: { alignItems: 'center', gap: 8, marginTop: 8 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  qrCard: { backgroundColor: colors.text, borderRadius: radii.card, padding: 18 },
  hint: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  copyButton: {
    ...glass,
    borderRadius: radii.pill,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyPressed: { backgroundColor: colors.cardStrong },
  copyText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
