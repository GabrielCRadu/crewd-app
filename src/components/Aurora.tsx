import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, onThemeChange } from '../theme/colors';
import { gradients } from '../theme/gradients';

interface Props {
  style?: StyleProp<ViewStyle>;
  /** Adaugă umbrirea de jos, pentru text peste suprafață. */
  withScrim?: boolean;
}

/**
 * Suprafața din locul pozelor care lipsesc (zona foto a evenimentelor, identitatea din Profil, bannerele).
 * În stilul monocrom (docs/design-language.md) e un gri închis plat: culoarea o dau pozele, nu interfața.
 * Numele „Aurora” a rămas din varianta veche, cu lumină caldă.
 */
export default function Aurora({ style, withScrim = false }: Props) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {withScrim ? <LinearGradient colors={gradients.scrim} style={styles.scrim} /> : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    container: { overflow: 'hidden', backgroundColor: colors.backgroundAlt },
    scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
