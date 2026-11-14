import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, onThemeChange } from '../theme/colors';
import type { TagTint } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { tr } from '../i18n';

interface Props {
  label: string;
  /** Pastilă albă (ales / comun) în loc de sticlă. */
  active?: boolean;
  /** Contur punctat: tag adăugat automat. */
  dashed?: boolean;
  /** Pastilă colorată (fundal ușor + contur), din `tagTints` (theme/colors.ts). */
  tint?: TagTint;
  onPress?: () => void;
  /** Afișează un ✕ și îl apelează la apăsare. */
  onRemove?: () => void;
}

/** Un tag sub formă de pastilă de sticlă (vezi docs/design-language.md). */
export default function Chip({ label, active = false, dashed = false, tint, onPress, onRemove }: Props) {
  return (
    <Pressable
      onPress={onPress ?? onRemove}
      disabled={!onPress && !onRemove}
      style={[
        styles.chip,
        active && styles.active,
        dashed && styles.dashed,
        tint && { backgroundColor: tint.background, borderColor: tint.border },
      ]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{tr(label)}</Text>
      {onRemove ? <Ionicons name="close" size={14} color={colors.muted} /> : null}
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    chip: {
      ...glass,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radii.pill,
    },
    active: { backgroundColor: colors.text, borderColor: colors.text },
    dashed: { borderStyle: 'dashed', borderColor: colors.faint, backgroundColor: 'transparent' },
    label: { color: colors.text, fontSize: 13, fontWeight: '500' },
    labelActive: { color: colors.onLight, fontWeight: '600' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
