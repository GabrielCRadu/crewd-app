import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import GlassIconButton from '../components/GlassIconButton';
import UserProfileView from '../components/profile/UserProfileView';
import { usePublicCard } from '../hooks/usePublicCard';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import { colors } from '../theme/colors';
import { radii } from '../theme/shape';
import { tr } from '../i18n';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PublicProfile'>;

/**
 * Profilul cuiva, deschis din codul lui QR (spec 2026-11-14-profil-membru-tema-design.md): username-ul
 * duce la cont (fișa din usernames/), apoi se arată profilul lui complet (profiles/{uid}).
 * Fără profil public încă, se vede fișa: poza mică, numele și @username.
 */
export default function PublicProfileScreen({ navigation, route }: Props) {
  const { username } = route.params;
  const { card, loading } = usePublicCard(username);

  if (card) {
    return (
      <UserProfileView
        uid={card.uid}
        fallback={{ name: card.name, photoUrl: card.photoThumb, username: card.username }}
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  note: { color: colors.muted, fontSize: 14 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.text, marginTop: 8 },
  pillText: { color: colors.onLight, fontWeight: '600' },
});
