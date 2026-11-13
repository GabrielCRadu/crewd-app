import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 2 },
});
