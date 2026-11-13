import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

interface Props {
  /** Nuanța cardului, ex. gradients.tintWarm sau gradients.tintCool. */
  tint: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Card de sticlă colorat cu o nuanță caldă: pentru cardurile pe care vrem să le scoatem în evidență. */
export default function TintedCard({ tint, style, children }: Props) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...glass, borderColor: colors.border, padding: 18, borderRadius: radii.card, overflow: 'hidden' },
});
