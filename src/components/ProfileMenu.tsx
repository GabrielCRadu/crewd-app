import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radii } from '../theme/shape';

/** Unde se deschide meniul: sub butonul cu trei linii, aliniat la dreapta lui. */
export interface MenuAnchor {
  top: number;
  right: number;
}

interface Props {
  /** null = închis. */
  anchor: MenuAnchor | null;
  onClose: () => void;
  onEdit: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Cât durează închiderea meniului (animația „fade”), înainte să facem ce ai ales. */
const CLOSE_DELAY_MS = 250;

/**
 * Meniul de pe profil (butonul cu trei linii, ca pe Instagram): un pătrățel mic în colț
 * cu Editează, Setări și Delogare. O atingere în afara lui îl închide.
 */
export default function ProfileMenu({ anchor, onClose, onEdit, onSettings, onSignOut }: Props) {
  // Fiecare opțiune închide întâi meniul, apoi face ce trebuie, după ce meniul a dispărut
  // (altfel întrebarea „Ești sigur…?” se pierdea pe Android, deschisă în timp ce meniul se închidea).
  const choose = (action: () => void) => () => {
    onClose();
    setTimeout(action, CLOSE_DELAY_MS);
  };

  const items: { label: string; icon: IconName; onPress: () => void; danger?: boolean }[] = [
    { label: 'Editează profilul', icon: 'create-outline', onPress: choose(onEdit) },
    { label: 'Setări', icon: 'settings-outline', onPress: choose(onSettings) },
    { label: 'Delogare', icon: 'log-out-outline', onPress: choose(onSignOut), danger: true },
  ];

  return (
    // Fără statusBarTranslucent: așa pozițiile măsurate cu measureInWindow se potrivesc cu ale modalului.
    <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Închide meniul" />
      {anchor ? (
        <View style={[styles.card, { top: anchor.top, right: anchor.right }]} accessibilityRole="menu">
          {items.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="menuitem"
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.rowPressed]}
            >
              <Ionicons name={item.icon} size={18} color={item.danger ? colors.nope : colors.text} />
              <Text style={[styles.label, item.danger && styles.danger]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    minWidth: 200,
    borderRadius: radii.inner,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowPressed: { backgroundColor: colors.cardStrong },
  label: { color: colors.text, fontSize: 15, fontWeight: '500' },
  danger: { color: colors.nope },
});
