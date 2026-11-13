import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../theme/colors';

export default function FriendsMapScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Hartă" subtitle="Unde sunt prietenii tăi" />
      <View style={styles.map}>
        <Ionicons name="map-outline" size={72} color={colors.muted} />
        <Text style={styles.hint}>Aici va fi harta cu prietenii</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  map: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hint: { color: colors.muted, fontSize: 15 },
});
