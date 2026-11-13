import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';

interface Props {
  /** Numele din care luăm inițialele (1 literă, sau 2 pentru grupuri). */
  name: string;
  size?: number;
  /** Pătrat cu colțuri rotunjite în loc de cerc (grupuri, poză de profil). */
  square?: boolean;
  initials?: 1 | 2;
}

function getInitials(name: string, count: 1 | 2): string {
  const words = name.trim().split(/\s+/);
  if (count === 1 || words.length < 2) return name.trim().slice(0, count).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

/** Avatar cu inițiale pe gradient cald, până avem poze reale. */
export default function Avatar({ name, size = 40, square = false, initials = 1 }: Props) {
  return (
    <LinearGradient
      colors={gradients.avatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { width: size, height: size, borderRadius: square ? size * 0.3 : size / 2 }]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{getInitials(name, initials)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.text, fontWeight: '600' },
});
