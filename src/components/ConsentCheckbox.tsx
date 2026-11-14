import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { tr } from '../i18n';
import { colors, onThemeChange } from '../theme/colors';
import { radii } from '../theme/shape';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  /** Mesaj sub bifă (ex. dacă încerci să creezi contul fără ea). */
  error?: string;
}

/**
 * Bifa de la crearea contului: „Am citit și accept termenii și politica de confidențialitate”,
 * cu linkuri către cele două documente sub ea.
 */
export default function ConsentCheckbox({ checked, onChange, onOpenTerms, onOpenPrivacy, error }: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        hitSlop={6}
        style={styles.row}
      >
        <View style={[styles.box, checked && styles.boxChecked, error ? styles.boxError : null]}>
          {checked ? <Ionicons name="checkmark" size={16} color={colors.onLight} /> : null}
        </View>
        <Text style={styles.text}>
          {tr('Am citit și accept termenii și condițiile și politica de confidențialitate. Am cel puțin 18 ani.')}
        </Text>
      </Pressable>
      <View style={styles.links}>
        <Pressable onPress={onOpenTerms} hitSlop={8} accessibilityRole="link">
          <Text style={styles.link}>{tr('Termeni și condiții')}</Text>
        </Pressable>
        <Text style={styles.dot}>·</Text>
        <Pressable onPress={onOpenPrivacy} hitSlop={8} accessibilityRole="link">
          <Text style={styles.link}>{tr('Politica de confidențialitate')}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const BOX = 22;

const makeStyles = () =>
  StyleSheet.create({
    root: { gap: 8 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    box: {
      width: BOX,
      height: BOX,
      marginTop: 1,
      borderRadius: radii.icon / 2,
      borderWidth: 1.5,
      borderColor: colors.faint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: { backgroundColor: colors.text, borderColor: colors.text },
    boxError: { borderColor: colors.nope },
    text: { flex: 1, color: colors.muted, fontSize: 14, lineHeight: 20 },
    links: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: BOX + 12 },
    link: { color: colors.text, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    dot: { color: colors.faint },
    error: { color: colors.nope, fontSize: 13, paddingLeft: BOX + 12 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
