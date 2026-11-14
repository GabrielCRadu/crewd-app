import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/shape';
import { tr } from '../i18n';

interface Props {
  /** Poza deschisă mare; null = închis. */
  photoUrl: string | null;
  /** Numele de sub poză (opțional). */
  caption?: string;
  onClose: () => void;
}

/** Latura pozei mărite, în pixeli (cât lățimea unui ecran de telefon). */
const FULL_SIZE = 1080;

/**
 * Varianta mare a pozei, ca să nu-și piardă claritatea pe tot ecranul.
 * Pozele de test de pe Unsplash vin la 400px, așa că cerem aceeași poză la 1080px.
 * Pozele încărcate din aplicație (data URI, photoService) sunt deja salvate mari.
 */
function fullSizeUrl(url: string): string {
  if (!url.startsWith('https://images.unsplash.com/')) return url;
  return url
    .replace(/([?&])w=\d+/, `$1w=${FULL_SIZE}`)
    .replace(/([?&])h=\d+/, `$1h=${FULL_SIZE}`)
    .replace(/([?&])q=\d+/, '$1q=85');
}

/**
 * Poza de profil mărită peste ecran, pe fundal negru.
 * Orice atingere, și pe poză, și lângă ea (sau butonul Înapoi pe Android), te întoarce la profil.
 */
export default function PhotoViewer({ photoUrl, caption, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 32, height * 0.7);
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!photoUrl) return;
    scale.setValue(0.85);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }).start();
  }, [photoUrl, scale]);

  return (
    <Modal visible={photoUrl !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={tr('Închide poza')}>
        {photoUrl ? (
          <Animated.View style={{ transform: [{ scale }] }}>
            {/* Poza mică (deja încărcată) stă dedesubt până vine varianta mare */}
            <Image source={{ uri: photoUrl }} style={[styles.photo, { width: size, height: size }]} />
            {fullSizeUrl(photoUrl) !== photoUrl ? (
              <Image
                source={{ uri: fullSizeUrl(photoUrl) }}
                style={[styles.photo, styles.full, { width: size, height: size }]}
                fadeDuration={150}
              />
            ) : null}
          </Animated.View>
        ) : null}
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  photo: { borderRadius: radii.card, backgroundColor: colors.surface },
  full: { position: 'absolute', top: 0, left: 0, backgroundColor: 'transparent' },
  caption: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
