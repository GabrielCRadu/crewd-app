import { StyleSheet, Text, View } from 'react-native';
import { colors, onThemeChange } from '../theme/colors';
import { type } from '../theme/typography';

export default function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    title: { ...type.screenTitle, fontSize: 32 },
    subtitle: { fontSize: 14, color: colors.muted, marginTop: 2 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
