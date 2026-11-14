import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import GlassIconButton from '../components/GlassIconButton';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';

/**
 * Setările contului (din meniul cu trei linii de pe profil).
 * Deocamdată doar ecranul; opțiunile vin în pasul următor.
 */
export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Setări</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.empty}>Setările apar aici în curând.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12, paddingBottom: 20 },
  title: { ...type.screenTitle, fontSize: 32 },
  card: { ...glass, borderRadius: radii.card, padding: 20 },
  empty: { color: colors.muted, fontSize: 15 },
});
