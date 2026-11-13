import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

/** Mesaj de eroare sau de confirmare sub un formular. */
export default function FormMessage({ text, tone = 'error' }: { text: string; tone?: 'error' | 'success' }) {
  return (
    <View style={[styles.box, tone === 'error' ? styles.error : styles.success]}>
      <Ionicons
        name={tone === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={18}
        color={tone === 'error' ? colors.nope : colors.like}
      />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radii.inner },
  error: { borderColor: colors.nope },
  success: { borderColor: colors.like },
  text: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
});
