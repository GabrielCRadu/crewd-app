import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';

interface Props {
  label: string;
  /** Plin (ales / comun) sau doar contur. */
  active?: boolean;
  /** Contur punctat: tag adăugat automat. */
  dashed?: boolean;
  onPress?: () => void;
  /** Afișează un ✕ și îl apelează la apăsare. */
  onRemove?: () => void;
}

/** Un tag sub formă de pastilă. */
export default function Chip({ label, active = false, dashed = false, onPress, onRemove }: Props) {
  return (
    <Pressable
      onPress={onPress ?? onRemove}
      disabled={!onPress && !onRemove}
      style={[styles.chip, active && styles.active, dashed && styles.dashed]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {onRemove ? <Ionicons name="close" size={14} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  dashed: { borderStyle: 'dashed', borderColor: colors.muted, backgroundColor: 'transparent' },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  labelActive: { color: '#fff' },
});
