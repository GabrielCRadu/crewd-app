import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, onThemeChange } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { radii } from '../theme/shape';

interface Props {
  /** Stilul interiorului (padding, gap...). */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Grosimea conturului colorat. */
const BORDER = 1.5;

/** Card cu interior negru și doar conturul colorat (portocaliu → roz → magenta). */
export default function GradientBorderCard({ style, children }: Props) {
  return (
    <LinearGradient colors={gradients.cardBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border}>
      <View style={[styles.inner, style]}>{children}</View>
    </LinearGradient>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    border: { padding: BORDER, borderRadius: radii.card },
    inner: { padding: 18, borderRadius: radii.card - BORDER, backgroundColor: colors.background },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
