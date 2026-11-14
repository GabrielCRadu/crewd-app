import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, onThemeChange } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { radii } from '../theme/shape';

interface Props {
  label: string;
  onPress?: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Iconița înaintea textului (implicit e după, ca o săgeată). */
  iconFirst?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  /** Dezactivat: estompat și nu răspunde la apăsare. */
  disabled?: boolean;
  /** În curs (ex. se trimite formularul): arată un indicator în locul iconiței. */
  loading?: boolean;
}

/** Butonul principal (CTA): pastilă cu gradient deschis și text închis. Unul singur pe ecran. */
export default function GradientButton({
  label,
  onPress,
  icon,
  iconFirst = false,
  style,
  compact = false,
  disabled = false,
  loading = false,
}: Props) {
  const iconEl = loading ? (
    <ActivityIndicator size="small" color={colors.onLight} />
  ) : icon ? (
    <Ionicons name={icon} size={compact ? 16 : 20} color={colors.onLight} />
  ) : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [style, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      <LinearGradient
        colors={gradients.cta}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.button, compact && styles.compact]}
      >
        {iconFirst ? iconEl : null}
        <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
        {iconFirst ? null : iconEl}
      </LinearGradient>
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 58,
      paddingHorizontal: 24,
      borderRadius: radii.pill,
    },
    compact: { height: 42, paddingHorizontal: 16 },
    label: { color: colors.onLight, fontSize: 17, fontWeight: '600' },
    labelCompact: { fontSize: 14 },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
