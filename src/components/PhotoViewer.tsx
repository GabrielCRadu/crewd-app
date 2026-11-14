import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/shape';

interface Props {
  /** Poza deschisă mare; null = închis. */
  photoUrl: string | null;
  /** Numele de sub poză (opțional). */
  caption?: string;
  onClose: () => void;
}

/**
 * Poza de profil mărită peste ecran, pe fundal negru.
 * O atingere în afara pozei (sau butonul Înapoi pe Android) te întoarce la profil.
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
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Închide poza">
        {photoUrl ? (
          <Animated.View style={{ transform: [{ scale }] }}>
            {/* Atingerea pe poză nu închide; doar cea de lângă ea */}
            <Pressable onPress={() => undefined}>
              <Image source={{ uri: photoUrl }} style={[styles.photo, { width: size, height: size }]} />
            </Pressable>
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
  caption: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
