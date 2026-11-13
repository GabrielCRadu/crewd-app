import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients } from '../theme/gradients';

/**
 * Lumina caldă difuză din partea de sus a unui ecran (docs/design-language.md → Aurora):
 * portocaliu din stânga sus și magenta din dreapta sus, care se sting în negru.
 * Se pune ca prim copil al ecranului; stă în spatele conținutului și nu primește atingeri.
 */
export default function ScreenGlow({ height = 380 }: { height?: number }) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <LinearGradient
        colors={gradients.screenGlowWarm}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gradients.screenGlowCool}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0 },
});
