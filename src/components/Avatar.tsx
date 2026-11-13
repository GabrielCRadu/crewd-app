import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

interface Props {
  /** Numele din care luăm inițialele (1 literă, sau 2 pentru grupuri). */
  name: string;
  size?: number;
  /** Pătrat cu colțuri rotunjite în loc de cerc (grupuri, poză de profil). */
  square?: boolean;
  initials?: 1 | 2;
  color?: string;
}

function getInitials(name: string, count: 1 | 2): string {
  const words = name.trim().split(/\s+/);
  if (count === 1 || words.length < 2) return name.trim().slice(0, count).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

/** Avatar cu inițiale, până avem poze reale. */
export default function Avatar({ name, size = 40, square = false, initials = 1, color = colors.primary }: Props) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: square ? size * 0.25 : size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{getInitials(name, initials)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '800' },
});
