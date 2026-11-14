import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import { usePublicCard } from '../hooks/usePublicCard';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import { colors, onThemeChange } from '../theme/colors';
import { radii } from '../theme/shape';
import { type } from '../theme/typography';
import { tr } from '../i18n';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PublicProfile'>;

/**
 * Fișa publică a cuiva, deschisă din codul lui QR (spec 2026-11-14-username-parola-design.md):
 * poza mică, numele și @username. Profilul complet rămâne privat; adăugarea la prieteni vine
 * când prietenii trec pe Firestore.
 */
export default function PublicProfileScreen({ navigation, route }: Props) {
  const { username } = route.params;
  const { card, loading } = usePublicCard(username);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : card ? (
          <>
            <Avatar name={card.name} size={112} square photoUrl={card.photoThumb} />
            <Text style={styles.name}>{card.name}</Text>
            <Text style={styles.username}>@{card.username}</Text>
            <Text style={styles.note}>{tr('Adăugarea la prieteni vine în curând.')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.note}>{tr('Contul nu mai există.')}</Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.pill}>
              <Text style={styles.pillText}>{tr('Înapoi')}</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 8 },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    name: { ...type.screenTitle, fontSize: 30, marginTop: 8 },
    username: { color: colors.muted, fontSize: 17 },
    note: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 12 },
    pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.text, marginTop: 8 },
    pillText: { color: colors.onLight, fontWeight: '600' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
