import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

interface Props {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  size?: number;
  /** Cerc în loc de pătrat rotunjit. */
  round?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Culoarea iconiței (implicit textul temei; peste poze: colors.photo.text). */
  color?: string;
}

/** Buton-iconiță de sticlă (înapoi, filtre, ✕). */
export default function GlassIconButton({ icon, onPress, size = 44, round = false, style, color = colors.text }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: round ? size / 2 : radii.icon },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { ...glass, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.cardStrong },
});
