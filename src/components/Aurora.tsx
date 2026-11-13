import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';

interface Props {
  style?: StyleProp<ViewStyle>;
  /** Adaugă umbrirea de jos, pentru text peste aurora. */
  withScrim?: boolean;
}

/**
 * Lumina caldă difuză din docs/design-language.md: câteva pete estompate
 * (galben, portocaliu, roz, magenta) peste fundalul închis.
 * Petele sunt View-uri mici cu boxShadow foarte mare, care produce estomparea.
 */
export default function Aurora({ style, withScrim = false }: Props) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <View style={[styles.blob, styles.magenta]} />
      <View style={[styles.blob, styles.pink]} />
      <View style={[styles.blob, styles.orange]} />
      <View style={[styles.blob, styles.yellow]} />
      {withScrim ? <LinearGradient colors={gradients.scrim} style={styles.scrim} /> : null}
    </View>
  );
}

const blob = (color: string, spread: number, blur: number) =>
  ({ backgroundColor: color, boxShadow: `0 0 ${blur}px ${spread}px ${color}` }) as const;

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: colors.backgroundAlt },
  blob: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  magenta: { top: '15%', right: '5%', ...blob(colors.accentMagenta, 70, 90) },
  pink: { top: '35%', left: '55%', ...blob(colors.accentPink, 60, 80) },
  orange: { top: '45%', left: '15%', ...blob(colors.accentOrange, 70, 90) },
  yellow: { top: '38%', left: '38%', ...blob(colors.accentYellow, 35, 60) },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
});
