import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import GradientButton from '../../components/GradientButton';
import OnboardingHeader from '../../components/OnboardingHeader';
import ProfilePhotoPicker from '../../components/ProfilePhotoPicker';
import ScreenGlow from '../../components/ScreenGlow';
import type { OnboardingStackParamList } from '../../navigation/authTypes';
import { colors } from '../../theme/colors';
import { type } from '../../theme/typography';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingPhoto'>;

/** Onboarding, pasul 2 din 3: poza de profil, obligatorie (spec 2026-11-14-username-parola-design.md). */
export default function OnboardingPhotoScreen({ navigation, route }: Props) {
  const { identity } = route.params;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGlow />
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingHeader step={2} onBack={() => navigation.goBack()} />

        <View style={styles.heading}>
          <Text style={styles.title}>Adaugă o poză cu tine</Text>
          <Text style={styles.subtitle}>Ceilalți te recunosc la întâlnire după ea. O poți înlocui oricând, dar nu șterge.</Text>
        </View>

        <ProfilePhotoPicker photoUrl={photoUrl} name={identity.name} onChange={setPhotoUrl} />

        <View style={styles.bottom}>
          <GradientButton
            label="Continuă"
            icon="arrow-forward"
            disabled={!photoUrl}
            onPress={() => photoUrl && navigation.navigate('OnboardingTags', { identity, photoUrl })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, gap: 28 },
  heading: { gap: 8 },
  title: { ...type.screenTitle, fontSize: 36 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  bottom: { marginTop: 'auto' },
});
